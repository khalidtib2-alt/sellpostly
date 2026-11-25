import {shopKey,type Shop} from './shop-data';
import {shopDraftKey,shopListKey} from './multi-shop-data';
export function mergeLogoDraft(shop:Shop,logo:string,storage:Pick<Storage,'getItem'|'setItem'>){
 const matches=(value:Shop)=>value.shopId===shop.shopId&&value.shopMode===shop.shopMode;
 try{for(const key of [shopDraftKey(shop),shopKey]){const raw=storage.getItem(key);if(raw){const value=JSON.parse(raw);if(matches(value))storage.setItem(key,JSON.stringify({...value,logo}));}}
 const list=JSON.parse(storage.getItem(shopListKey)||'[]');if(Array.isArray(list))storage.setItem(shopListKey,JSON.stringify(list.map(value=>matches(value)?{...value,logo}:value)));return true;}catch{return false;}
}
