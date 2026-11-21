import 'server-only';
import {validShopSlug,ShopError,runShopQuery} from './multi-shop-service';
import type {Query} from './order-service';
export async function renameShop(owner:string,value:{slug?:unknown;shopId?:unknown;currentSlug?:unknown},query:Query=runShopQuery){
 if(!validShopSlug(value.slug)||typeof value.currentSlug!=='string')throw new ShopError('INVALID_SHOP_SLUG');
 // Ownership, not a client shop ID, authorizes the update. Primary catalogs share one row/slug.
 try{const rows=await query('UPDATE shops SET slug=$3,updated_at=now() WHERE owner_key=$1 AND slug=$2 RETURNING id,slug',[owner,value.currentSlug,value.slug]);if(!rows[0])throw new ShopError('SHOP_NOT_FOUND',404);return rows[0];}catch(error){if((error as {code?:string}).code==='23505')throw new ShopError('SLUG_UNAVAILABLE',409);throw error;}
}
