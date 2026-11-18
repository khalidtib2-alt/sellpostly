import 'server-only';
import { db } from './db';
import { ApiError,object,text,contact,coin,network,txId,uuid,priceItems,units } from './order-validation';
import { validateShop } from '../app/shop/shop-data';
import { escrowWallet,escrowNetwork,escrowReady } from '../app/shop/escrow-config';
import { validWallet } from '../app/shop/crypto-data';
export type Row=Record<string,any>;
export type Query=(sql:string,parameters:unknown[])=>Promise<Row[]>;
const run:Query=async(sql,parameters)=>await db().query(sql,parameters);
export async function submitOrder(value:unknown,query:Query=run){
 const raw=object(value),slug=text(raw.slug,64),selectedCoin=coin(raw.coin),net=network(raw.network),tx=txId(raw.tx_id,net);
 if(!escrowReady||net!==escrowNetwork)throw new ApiError('ESCROW_UNAVAILABLE',503);
 const buyer=object(raw.buyer),buyerContact=contact(buyer.contact),name=text(buyer.name,100);
 const shops=await query('SELECT id,catalog,escrow_hold_days,suspended FROM shops WHERE slug=$1 AND published=true',[slug]);
 if(!shops.length)throw new ApiError('SHOP_NOT_FOUND',404);
 if(shops[0].suspended)throw new ApiError('STORE_SUSPENDED',403);
 const shop=validateShop(shops[0].catalog);if(shop.shopMode!=='personal')throw new ApiError('CHECKOUT_UNAVAILABLE');
 const priced=priceItems(shop.products,raw.items,selectedCoin);
 const details={items:priced.items,buyer:{name,contact:buyerContact},delivery_note:typeof raw.delivery_note==='string'?text(raw.delivery_note,400,false):'',receiving_wallet:escrowWallet};
 // INSERT SELECT also checks the catalog has not changed during price calculation.
 const rows=await query(`INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details)
 SELECT id,$2::numeric,$3,$4,$5,$6::jsonb FROM shops WHERE id=$1::uuid AND published=true AND suspended=false AND catalog=$7::jsonb
 RETURNING id,gross_amount::text,coin,network,status,escrow_hold_days,created_at`,
 [shops[0].id,priced.gross,selectedCoin,net,tx,JSON.stringify(details),JSON.stringify(shops[0].catalog)]);
 if(!rows.length)throw new ApiError('CATALOG_CHANGED',409);
 return rows[0];
}
export const BUYER_ACTION_SQL=`UPDATE orders SET
 status=CASE WHEN $3='dispute' THEN 'disputed' ELSE status END,
 details=details || CASE WHEN $3='dispute' THEN jsonb_build_object('dispute',jsonb_build_object('reason',$4::text,'opened_at',now())) ELSE jsonb_build_object('buyer_confirmed_at',now()) END
 WHERE id=$1::uuid AND details->'buyer'->>'contact'=$2 AND (status='held' OR ($3='confirm_receipt' AND status='disputed'))
 RETURNING id,status,escrow_release_at,details->>'buyer_confirmed_at' AS buyer_confirmed_at`;
export async function buyerAction(id:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),match=contact(raw.contact),action=raw.action||'dispute';
 if(!['dispute','confirm_receipt','status'].includes(String(action)))throw new ApiError('INVALID_INPUT');
 if(action==='status'){
  const rows=await query(`SELECT id,status,gross_amount::text,coin,network,escrow_release_at,details->'fulfillment' AS fulfillment,details->>'buyer_confirmed_at' AS buyer_confirmed_at FROM orders WHERE id=$1::uuid AND details->'buyer'->>'contact'=$2`,[id,match]);
  if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);return rows[0];
 }
 const reason=action==='dispute'?text(raw.reason,1000):'';
 const rows=await query(BUYER_ACTION_SQL,[id,match,action,reason]);
 if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);
 return rows[0];
}
export const FULFILL_SQL=`UPDATE orders o SET details=o.details || jsonb_build_object('fulfillment',jsonb_build_object('tracking',$3::text,'delivery_notes',$4::text,'updated_at',now()))
 FROM shops s WHERE o.shop_id=s.id AND s.owner_key=$2 AND o.id=$1::uuid AND o.status IN ('held','released') AND EXISTS (SELECT 1 FROM subscriptions WHERE owner_key=s.owner_key AND status='active')
 RETURNING o.id,o.status,o.details->'fulfillment' AS fulfillment`;
export async function fulfill(id:string,ownerKey:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),tracking=text(raw.tracking??'',500,false),notes=text(raw.delivery_notes??'',4000,false);
 if(!tracking&&!notes)throw new ApiError('INVALID_INPUT');
 const rows=await query(FULFILL_SQL,[id,ownerKey,tracking,notes]);
 if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);return rows[0];
}
export async function payout(ownerKey:string,value:unknown,query:Query=run){
 const raw=object(value),amount=text(raw.amount,21),selectedCoin=coin(raw.coin),net=network(raw.network),wallet=text(raw.wallet,100);
 if(units(amount)<BigInt(10000000))throw new ApiError('MINIMUM_PAYOUT');
 if(!validWallet(wallet,net))throw new ApiError('INVALID_WALLET');
 const shops=await query('SELECT id FROM shops WHERE owner_key=$1',[ownerKey]);
 if(!shops.length)throw new ApiError('SHOP_NOT_FOUND',404);
 try{
  const rows=await query('SELECT request_seller_payout($1::uuid,$2,$3::numeric,$4,$5,$6) AS id',[shops[0].id,ownerKey,amount,selectedCoin,net,wallet]);return rows[0];
 }catch(error){if((error as {code?:string}).code==='P0001')throw new ApiError('PAYOUT_NOT_AVAILABLE',409);throw error;}
}
export const DASHBOARD_SQL=`WITH owned AS (SELECT id,slug,name,escrow_hold_days FROM shops WHERE owner_key=$1),
 ord AS (SELECT o.* FROM orders o JOIN owned s ON s.id=o.shop_id),
 pay AS (SELECT p.* FROM payout_requests p JOIN owned s ON s.id=p.shop_id),
 buckets AS (SELECT coin,network FROM ord UNION SELECT coin,network FROM pay),
 balances AS (SELECT b.coin,b.network,
 (SELECT coalesce(sum(gross_amount),0)::text FROM ord WHERE coin=b.coin AND network=b.network AND status IN ('held','released','disputed')) AS gross_sales,
 (SELECT coalesce(sum(commission_amount),0)::text FROM ord WHERE coin=b.coin AND network=b.network AND status IN ('held','released','disputed')) AS total_commission,
 (SELECT coalesce(sum(net_amount),0)::text FROM ord WHERE coin=b.coin AND network=b.network AND status IN ('held','disputed')) AS pending_escrow,
 ((SELECT coalesce(sum(net_amount),0) FROM ord WHERE coin=b.coin AND network=b.network AND status='released' AND (escrow_release_at<=now() OR force_released_at IS NOT NULL))-(SELECT coalesce(sum(amount),0) FROM pay WHERE coin=b.coin AND network=b.network AND status IN ('pending','approved','paid')))::text AS available_balance,
 (SELECT coalesce(sum(amount),0)::text FROM pay WHERE coin=b.coin AND network=b.network AND status='paid') AS total_redeemed
 FROM buckets b)
 SELECT (SELECT row_to_json(s) FROM owned s) AS shop,
 coalesce((SELECT json_agg(b ORDER BY coin,network) FROM balances b),'[]') AS balances,
 coalesce((SELECT json_agg(json_build_object('id',id,'gross_amount',gross_amount::text,'commission_amount',commission_amount::text,'net_amount',net_amount::text,'coin',coin,'network',network,'status',status,'tx_id',tx_id,'escrow_hold_days',escrow_hold_days,'escrow_release_at',escrow_release_at,'force_released_at',force_released_at,'payment_verified_at',payment_verified_at,'created_at',created_at,'details',details) ORDER BY created_at DESC,id) FROM ord),'[]') AS orders,
 coalesce((SELECT json_agg(json_build_object('id',id,'amount',amount::text,'coin',coin,'network',network,'wallet',wallet,'status',status,'tx_id',tx_id,'created_at',created_at) ORDER BY created_at DESC,id) FROM pay),'[]') AS payouts`;
export async function dashboard(ownerKey:string,query:Query=run){return (await query(DASHBOARD_SQL,[ownerKey]))[0];}

