import {safeImage} from '../app/shop/shop-data';
import type {Query} from './order-service';
import {ShopError} from './multi-shop-service';
export async function saveShopLogo(owner:string,value:unknown,query:Query){
 const raw=value as {shopId?:string;shopMode?:string;logo?:string};
 if(!raw||!raw.shopId||!/^[0-9a-f-]{36}$/i.test(raw.shopId)||!['personal','affiliate'].includes(raw.shopMode||'')||typeof raw.logo!=='string'||raw.logo.length>500000||(raw.logo&&!safeImage(raw.logo)))throw new ShopError('INVALID_SHOP_LOGO');
 const logo=safeImage(raw.logo);
 const rows=await query(`UPDATE shops SET logo=$3,
 catalog=CASE WHEN coalesce(catalog->>'shopMode','affiliate')=$4 THEN jsonb_set(coalesce(catalog,'{}'::jsonb),'{logo}',to_jsonb($3::text),true) ELSE catalog END,
 personal_catalog=CASE WHEN $4='personal' THEN jsonb_set(coalesce(personal_catalog,CASE WHEN catalog->>'shopMode'='personal' THEN catalog ELSE jsonb_build_object('name',name,'bio','','products','[]'::jsonb,'shopMode',$4::text) END),'{logo}',to_jsonb($3::text),true) ELSE personal_catalog END,
 affiliate_catalog=CASE WHEN $4='affiliate' THEN jsonb_set(coalesce(affiliate_catalog,CASE WHEN coalesce(catalog->>'shopMode','affiliate')='affiliate' THEN catalog ELSE jsonb_build_object('name',name,'bio','','products','[]'::jsonb,'shopMode',$4::text) END),'{logo}',to_jsonb($3::text),true) ELSE affiliate_catalog END,updated_at=now()
 WHERE owner_key=$1 AND id=$2::uuid AND deleted_at IS NULL AND (store_mode='general' OR (shop_type=$4 AND seller_effective_plan(owner_key)='pro')) RETURNING id`,[owner,raw.shopId,logo,raw.shopMode]);
 if(!rows[0])throw new ShopError('SHOP_NOT_FOUND',404);return {logo};
}
