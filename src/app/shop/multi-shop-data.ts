import {shopKey,validateShop,type Shop,type ShopMode} from './shop-data';
export const shopListKey='sellpostly-shops-v2',activeShopKey='sellpostly-active-shop-v2';
export const shopSelection=(shop:Shop)=>shop.storeMode==='niche'?'niche:'+shop.shopId:'primary:'+shop.shopMode;
export const shopDraftKey=(shop:Shop)=>shop.storeMode==='niche'&&shop.shopId?shopKey+':niche:'+shop.shopId:shopKey+':catalog:'+shop.shopMode;
type Store=Pick<Storage,'getItem'|'setItem'>;
export function readShopList(storage:Store):Shop[]{try{const list=JSON.parse(storage.getItem(shopListKey)||'[]');return Array.isArray(list)?list.map(validateShop):[];}catch{return [];}}
export function persistShop(shop:Shop,storage:Store){const normalized=validateShop(shop);storage.setItem(shopDraftKey(shop),JSON.stringify(normalized));const list=readShopList(storage).filter(s=>shopSelection(s)!==shopSelection(shop));storage.setItem(shopListKey,JSON.stringify([...list,normalized]));storage.setItem(activeShopKey,shopSelection(shop));storage.setItem(shopKey,JSON.stringify(normalized));}
export function switchShop(current:Shop,target:Shop,storage:Store){persistShop(current,storage);let next=target;const saved=storage.getItem(shopDraftKey(target));if(saved){next=validateShop({...JSON.parse(saved),shopId:target.shopId,customSlug:target.customSlug,storeMode:target.storeMode,shopMode:target.shopMode,escrowHoldDays:target.escrowHoldDays,mainStoreSlug:target.mainStoreSlug});}persistShop(next,storage);return next;}
export function targetPendingShop(current:Shop,shopId:string|undefined,mode:ShopMode|undefined,storage:Store){
 if(shopId){const target=readShopList(storage).find(s=>s.shopId===shopId&&(!mode||s.shopMode===mode));if(!target)throw Error('IMPORT_TARGET_NOT_FOUND');return shopSelection(current)===shopSelection(target)?current:switchShop(current,target,storage);}
 if(mode&&(mode!==current.shopMode||current.storeMode==='niche')){const target=readShopList(storage).find(s=>s.storeMode!=='niche'&&s.shopMode===mode);if(target)return switchShop(current,target,storage);}
 return current;
}
export function shopHeaders(storage:Pick<Storage,'getItem'>){return {'x-pro-key':storage.getItem('sellpostly-pro-key')||'','x-shop-key':storage.getItem('sellpostly-free-shop-key')||''};}
