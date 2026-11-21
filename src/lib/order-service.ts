import {containsCardData,governance,normalizePayments} from '../app/shop/payment-config';
import 'server-only';
import {deliverySnapshot} from '../app/shop/digital-data';
import {emailAddress} from './email';
import {locale} from './locale';
import {buyerPhone} from './whatsapp-replies';
import { db } from './db';
import { ApiError,object,text,contact,coin,network,txId,uuid,priceItems,units } from './order-validation';
import { validateShop } from '../app/shop/shop-data';
import { escrowWallet,escrowNetwork,escrowReady } from '../app/shop/escrow-config';
import { validWallet } from '../app/shop/crypto-data';
export type Row=Record<string,any>;
export type Query=(sql:string,parameters:unknown[])=>Promise<Row[]>;
const run:Query=async(sql,parameters)=>await db().query(sql,parameters);
export async function submitOrder(value:unknown,query:Query=run){
 const raw=object(value);if(containsCardData(raw))throw new ApiError('CARD_DATA_NOT_ALLOWED');if(raw.coin!=='USDC')throw new ApiError('ESCROW_USDC_ONLY');const slug=text(raw.slug,64),selectedCoin=coin(raw.coin),net=network(raw.network),tx=txId(raw.tx_id,net);
 if(!escrowReady||net!==escrowNetwork)throw new ApiError('ESCROW_UNAVAILABLE',503);
 const buyer=object(raw.buyer),buyerContact=contact(buyer.contact),name=text(buyer.name,100);if(!emailAddress(buyerContact))throw new ApiError('INVALID_CONTACT');
 const shops=await query('SELECT id,coalesce(personal_catalog,catalog) AS catalog,seller_usdc_wallet,cod_enabled,escrow_enabled,escrow_hold_days,suspended FROM shops WHERE slug=$1 AND published=true',[slug]);
 if(!shops.length)throw new ApiError('SHOP_NOT_FOUND',404);
 if(shops[0].suspended)throw new ApiError('STORE_SUSPENDED',403);
 const shop=validateShop(shops[0].catalog);if(shop.shopMode!=='personal'||shop.escrowEnabled===false||shops[0].escrow_enabled===false)throw new ApiError('CHECKOUT_UNAVAILABLE');
 if(governance(shop.escrowGovernance)==='off'||!normalizePayments(shop.payments,shop).USDC_DIRECT.enabled)throw new ApiError('ESCROW_UNAVAILABLE');
 const priced=priceItems(shop.products,raw.items,selectedCoin);
 const phone=buyer.phone===undefined||buyer.phone===''?'':buyerPhone(buyer.phone);if(buyer.phone&&!phone)throw new ApiError('INVALID_CONTACT');
 const delivery=deliverySnapshot(priced.items.map(item=>({product:shop.products.find(p=>p.id===item.id)!,quantity:item.quantity})));
 const details={...delivery,store_name:shop.name,language:locale(raw.language),items:priced.items,buyer:{name,contact:buyerContact,phone},delivery_note:!delivery.digital_only&&typeof raw.delivery_note==='string'?text(raw.delivery_note,400,false):'',receiving_wallet:escrowWallet,escrow_governance:'usdc_only',seller_wallet:shops[0].seller_usdc_wallet||shop.cryptoWallet||''};
 // INSERT SELECT also checks the catalog has not changed during price calculation.
 const rows=await query(`INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details)
 SELECT id,$2::numeric,$3,$4,$5,$6::jsonb FROM shops WHERE id=$1::uuid AND published=true AND suspended=false AND escrow_enabled=true AND coalesce(personal_catalog,catalog)=$7::jsonb
 RETURNING id,gross_amount::text,coin,network,status,escrow_status,escrow_hold_days,created_at`,
 [shops[0].id,priced.gross,selectedCoin,net,tx,JSON.stringify(details),JSON.stringify(shops[0].catalog)]);
 if(!rows.length)throw new ApiError('CATALOG_CHANGED',409);
 return rows[0];
}
export const BUYER_ACTION_SQL=`UPDATE orders SET
 status=CASE WHEN $3='dispute' THEN 'disputed' ELSE status END,
 details=details || CASE WHEN $3='dispute' THEN jsonb_build_object('dispute',jsonb_build_object('reason',$4::text,'opened_at',now())) ELSE jsonb_build_object('buyer_confirmed_at',now()) END
 WHERE id=$1::uuid AND details->'buyer'->>'contact'=$2 AND (status='held' OR ($3='confirm_receipt' AND status='disputed')) AND ($5::text IS NULL OR EXISTS(SELECT 1 FROM shops WHERE shops.id=orders.shop_id AND shops.slug=$5::text))
 RETURNING id,status,escrow_release_at,details->>'buyer_confirmed_at' AS buyer_confirmed_at`;
export async function buyerAction(id:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),match=contact(raw.contact),action=raw.action||'dispute';
 if(!['dispute','confirm_receipt','status'].includes(String(action)))throw new ApiError('INVALID_INPUT');
 if(action==='status'){
  const rows=await query(`SELECT id,status,gross_amount::text,coin,network,escrow_release_at,details->'fulfillment' AS fulfillment,CASE WHEN (payment_method='CRYPTO' AND payment_verified_at IS NOT NULL AND status IN ('held','released','disputed')) OR (payment_method<>'CRYPTO' AND status='fulfilled') THEN details->'digital_items' ELSE NULL END AS digital_delivery,details->>'buyer_confirmed_at' AS buyer_confirmed_at FROM orders WHERE id=$1::uuid AND details->'buyer'->>'contact'=$2`,[id,match]);
  if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);return rows[0];
 }
 const scope=raw.storeSlug===undefined?null:text(raw.storeSlug,64);
 if(scope&&!/^[a-z0-9][a-z0-9-]{2,63}$/.test(scope))throw new ApiError('INVALID_INPUT');
 const reason=action==='dispute'?text(raw.reason,1000):'';
 const rows=await query(BUYER_ACTION_SQL,[id,match,action,reason,scope]);
 if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);
 return rows[0];
}
export const FULFILL_SQL=`UPDATE orders o SET details=o.details || jsonb_build_object('fulfillment',jsonb_build_object('tracking',$3::text,'delivery_notes',$4::text,'carrier',$5::text,'status','shipped','updated_at',now())),status=CASE WHEN o.payment_method<>'CRYPTO' THEN 'fulfilled' ELSE o.status END
 FROM shops s WHERE o.shop_id=s.id AND s.owner_key=$2 AND o.id=$1::uuid AND (o.status IN ('held','released') OR (o.payment_method<>'CRYPTO' AND o.status IN ('pending','fulfilled'))) AND EXISTS (SELECT 1 FROM subscriptions WHERE owner_key=s.owner_key AND status='active')
 RETURNING o.id,o.status,o.details->'fulfillment' AS fulfillment`;
export async function fulfill(id:string,ownerKey:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),tracking=text(raw.tracking??'',500,false),notes=text(raw.delivery_notes??'',4000,false),carrier=text(raw.carrier??'',100,false);
 if(!tracking&&!notes)throw new ApiError('INVALID_INPUT');
 const rows=await query(FULFILL_SQL,[id,ownerKey,tracking,notes,carrier]);
 if(!rows.length)throw new ApiError('ORDER_NOT_FOUND_OR_NOT_ELIGIBLE',404);return rows[0];
}
export async function payout(ownerKey:string,value:unknown,query:Query=run){
 const raw=object(value),amount=text(raw.amount,21),selectedCoin=coin(raw.coin),net=network(raw.network),wallet=text(raw.wallet,100);
 if(units(amount)<BigInt(10000000))throw new ApiError('MINIMUM_PAYOUT');
 if(!validWallet(wallet,net))throw new ApiError('INVALID_WALLET');
 const shopId=typeof raw.shop_id==='string'&&/^[0-9a-f-]{36}$/i.test(raw.shop_id)?raw.shop_id:null;
 const shops=await query("SELECT id FROM shops WHERE owner_key=$1 AND ($2::uuid IS NULL OR id=$2::uuid) ORDER BY (store_mode='general') DESC,created_at LIMIT 1",[ownerKey,shopId]);
 if(!shops.length)throw new ApiError('SHOP_NOT_FOUND',404);
 try{
  const rows=await query('SELECT request_seller_payout($1::uuid,$2,$3::numeric,$4,$5,$6) AS id',[shops[0].id,ownerKey,amount,selectedCoin,net,wallet]);return rows[0];
 }catch(error){if((error as {code?:string}).code==='P0001')throw new ApiError('PAYOUT_NOT_AVAILABLE',409);throw error;}
}
export const DASHBOARD_SQL=`WITH owned AS (SELECT id,slug,name,escrow_hold_days FROM shops WHERE owner_key=$1 AND ($2::uuid IS NULL OR id=$2::uuid) ORDER BY (store_mode='general') DESC,created_at LIMIT 1),
 all_ord AS (SELECT o.* FROM orders o JOIN owned s ON s.id=o.shop_id),
 ord AS (SELECT * FROM all_ord WHERE payment_method='CRYPTO'),
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
 coalesce((SELECT json_agg(json_build_object('id',id,'gross_amount',gross_amount::text,'commission_amount',commission_amount::text,'net_amount',net_amount::text,'coin',coin,'network',network,'status',status,'tx_id',tx_id,'escrow_hold_days',escrow_hold_days,'escrow_release_at',escrow_release_at,'force_released_at',force_released_at,'payment_verified_at',payment_verified_at,'created_at',created_at,'details',details,'payment_method',payment_method,'escrow_status',escrow_status) ORDER BY created_at DESC,id) FROM all_ord),'[]') AS orders,
 coalesce((SELECT json_agg(json_build_object('id',id,'amount',amount::text,'coin',coin,'network',network,'wallet',wallet,'status',status,'tx_id',tx_id,'created_at',created_at) ORDER BY created_at DESC,id) FROM pay),'[]') AS payouts`;
export async function dashboard(ownerKey:string,query:Query=run,shopId?:string){if(shopId&&!/^[0-9a-f-]{36}$/i.test(shopId))throw new ApiError('SHOP_NOT_FOUND',404);return (await query(DASHBOARD_SQL,[ownerKey,shopId||null]))[0];}

