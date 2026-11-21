import {cartStorageKey,legacyCartStorageKey} from './product-links';
import {readShopList,shopDraftKey,persistShop,shopListKey} from './multi-shop-data';
import type {Shop} from './shop-data';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function removeNicheShopDraft(deleted:Shop,storage:Store){
 if(deleted.storeMode!=='niche'||deleted.isPrimary!==false||!deleted.shopId)throw Error('PRIMARY_SHOP_PROTECTED');
 const remaining=readShopList(storage).filter(s=>s.shopId!==deleted.shopId);
 const next=remaining.find(s=>s.storeMode!=='niche'&&s.shopMode===deleted.shopMode)||remaining.find(s=>s.storeMode!=='niche');
 if(!next)throw Error('PRIMARY_SHOP_NOT_LOADED');
 storage.setItem(shopListKey,JSON.stringify(remaining));persistShop(next,storage);
 storage.removeItem(shopDraftKey(deleted));for(const id of [deleted.customSlug,deleted.shopId])if(id){storage.removeItem(cartStorageKey(id));storage.removeItem(legacyCartStorageKey(id));}
 for(const key of ['sellpostly_pending_shop_item','sellpostly_pending_studio_item']){try{const item=JSON.parse(storage.getItem(key)||'null');if(item?.targetShopId===deleted.shopId)storage.removeItem(key);}catch{}}
 return {shop:next,shops:readShopList(storage)};
}
