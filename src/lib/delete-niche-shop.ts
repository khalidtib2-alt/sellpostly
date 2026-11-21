import 'server-only';
import {runShopQuery,ShopError} from './multi-shop-service';
import type {Query} from './order-service';
// Retain the ledger parent so existing orders, disputes and payouts remain valid.
export const DELETE_NICHE_SQL=`UPDATE shops SET deleted_at=now(),published=false,
 catalog=jsonb_set(catalog,'{products}','[]'::jsonb),
 affiliate_catalog=CASE WHEN affiliate_catalog IS NULL THEN NULL ELSE jsonb_set(affiliate_catalog,'{products}','[]'::jsonb) END,
 personal_catalog=CASE WHEN personal_catalog IS NULL THEN NULL ELSE jsonb_set(personal_catalog,'{products}','[]'::jsonb) END,
 updated_at=now() WHERE owner_key=$1 AND id=$2::uuid AND store_mode='niche' AND is_primary=false AND deleted_at IS NULL RETURNING id,slug`;
export async function deleteNicheShop(owner:string,id:unknown,query:Query=runShopQuery){
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ShopError('INVALID_SHOP_ID');
 const rows=await query(DELETE_NICHE_SQL,[owner,id]);
 if(!rows[0])throw new ShopError('NICHE_SHOP_NOT_FOUND_OR_PRIMARY',404);
 return {deleted:true,id:rows[0].id};
}
