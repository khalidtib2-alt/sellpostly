import {storePolicyReady} from '../app/shop/store-policy-data';
import {persistShop,shopHeaders} from '../app/shop/multi-shop-data';
import {validateShop,shopKey,type Shop} from '../app/shop/shop-data';
import {modeCatalogKey} from '../app/shop/catalog-modes';
/** Save only: sharing, scrolling and navigation are intentionally outside this action. */
export async function savePaymentSettings(shop:Shop,storage:Pick<Storage,'getItem'|'setItem'>,request:typeof fetch=fetch){
 if(shop.shopMode!=='personal')throw Error('PERSONAL_STORE_REQUIRED');if(!storePolicyReady(shop))throw Error('STORE_POLICY_REQUIRED');
 const normalized=validateShop(shop),key=storage.getItem('sellpostly-pro-key')||'';
 const response=await request('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(storage),'x-pro-key':key},body:JSON.stringify(normalized)});
 if(!response.ok)throw Error('PAYMENT_SAVE_FAILED');
 const result=await response.json();if(typeof result.slug!=='string'||!/^[a-z0-9][a-z0-9-]{2,63}$/.test(result.slug))throw Error('PAYMENT_SAVE_FAILED');
 let localSaved=true;try{storage.setItem(shopKey,JSON.stringify(normalized));persistShop(normalized,storage);}catch{localSaved=false;}
 return {shop:normalized,slug:result.slug,localSaved};
}
