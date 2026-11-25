import {persistShop,shopHeaders} from '../app/shop/multi-shop-data';
import type {Shop} from '../app/shop/shop-data';
type DraftStorage=Pick<Storage,'getItem'|'setItem'>;
export function saveShopDraft(shop:Shop,storage:DraftStorage){persistShop(shop,storage);}
/** Explicit publishing shares the same auth and catalog validation as existing shop mutations. */
export async function publishShopDraft(shop:Shop,storage:DraftStorage,request:typeof fetch=fetch){
 saveShopDraft(shop,storage);
 const response=await request('/api/shops',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...shopHeaders(storage)},body:JSON.stringify(shop)});
 if(!response.ok)throw Error('PUBLISH_FAILED');
 const result=await response.json();if(typeof result.slug!=='string'||!/^[a-z0-9][a-z0-9-]{2,63}$/.test(result.slug))throw Error('INVALID_PUBLISH_RESPONSE');
 return {slug:result.slug};
}
