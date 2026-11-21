import {containsCardData} from '../app/shop/payment-config';
import 'server-only';
import {storePolicyReady} from '../app/shop/store-policy-data';
import {deliverySnapshot} from '../app/shop/digital-data';
import {db} from './db';
import {ApiError,object,text,contact,uuid,priceItems} from './order-validation';
import {validateShop} from '../app/shop/shop-data';
import {stableAmount} from '../app/shop/crypto-data';
import {locale} from './locale';
import {buyerPhone} from './whatsapp-replies';
import {emailAddress} from './email';
import type {Query} from './order-service';
export async function submitCodOrder(value:unknown,query:Query=async(sql,args)=>await db().query(sql,args)){
 const raw=object(value);if(containsCardData(raw))throw new ApiError('CARD_DATA_NOT_ALLOWED');const slug=text(raw.slug,64),requestId=uuid(raw.request_id),buyer=object(raw.buyer);
 const email=emailAddress(contact(buyer.contact));if(!email)throw new ApiError('INVALID_CONTACT');
 const phone=buyerPhone(text(buyer.phone,30)),address=text(raw.delivery_address||'',400,false),name=text(buyer.name,100);
 if(!phone)throw new ApiError('INVALID_CONTACT');
 const row=(await query(`SELECT id,coalesce(personal_catalog,catalog) AS catalog,cod_enabled,suspended FROM shops WHERE slug=$1 AND deleted_at IS NULL AND published=true AND (store_mode='general' OR seller_effective_plan(owner_key)='pro')`,[slug]))[0];
 if(!row)throw new ApiError('SHOP_NOT_FOUND',404);if(row.suspended)throw new ApiError('STORE_SUSPENDED',403);
 const shop=validateShop(row.catalog);if(!storePolicyReady(shop))throw new ApiError('STORE_POLICY_REQUIRED',409);
 if(shop.shopMode!=='personal'||row.cod_enabled===false||shop.codEnabled===false)throw new ApiError('COD_UNAVAILABLE',409);
 const priced=priceItems(shop.products,raw.items,'USDC');
 if(priced.items.some(item=>stableAmount(shop.products.find(p=>p.id===item.id)!.price)?.coin))throw new ApiError('PRICE_UNAVAILABLE');
 const delivery=deliverySnapshot(priced.items.map(item=>({product:shop.products.find(p=>p.id===item.id)!,quantity:item.quantity})));if(!delivery.digital_only&&!address)throw new ApiError('INVALID_INPUT');
 const details={...delivery,store_name:shop.name,request_id:requestId,language:locale(raw.language),items:priced.items,buyer:{name,contact:email,phone},delivery_note:delivery.digital_only?'':address};
 const result=await query(`INSERT INTO orders(shop_id,gross_amount,coin,network,payment_method,escrow_status,details)
 SELECT id,$2::numeric,'USD','COD','COD','NONE',$3::jsonb FROM shops WHERE id=$1::uuid AND published=true AND suspended=false AND (store_mode='general' OR seller_effective_plan(owner_key)='pro') AND cod_enabled=true AND coalesce(personal_catalog,catalog)=$4::jsonb
 ON CONFLICT DO NOTHING RETURNING id,status,payment_method,escrow_status,gross_amount::text`,[row.id,priced.gross,JSON.stringify(details),JSON.stringify(row.catalog)]);
 if(result.length)return result[0];
 const previous=await query("SELECT id,status,payment_method,escrow_status,gross_amount::text FROM orders WHERE shop_id=$1::uuid AND payment_method='COD' AND details->>'request_id'=$2 AND details=$3::jsonb",[row.id,requestId,JSON.stringify(details)]);
 if(previous.length)return previous[0];throw new ApiError('CATALOG_CHANGED',409);
}
