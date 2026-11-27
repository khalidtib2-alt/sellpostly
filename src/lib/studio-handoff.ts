import {normalizePending,pendingProduct,pendingShopKey,type PendingShopItem} from './shop-handoff';
import {validateShop,type Shop} from '../app/shop/shop-data';
import {persistShop,shopHeaders,shopDraftKey} from '../app/shop/multi-shop-data';
import {studioImage} from './studio-image';
export const studioImportKey='sellpostly_pending_studio_item';
export function normalizeStudioImport(value:unknown,fallbackTitle='Product Photo'){
 const raw=typeof value==='string'?{image:value}:value;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_PRODUCT');
 const item=raw as Record<string,unknown>,image=studioImage(item.image||item.img||item.src||item.productImage);if(typeof value==='string'&&!image)throw Error('INVALID_IMAGE');
 return {...normalizePending({...item,title:item.title||item.name||fallbackTitle,image:''}),image};
}
export function studioProduct(value:unknown,shop:Shop){const item=normalizePending({...value as Record<string,unknown>,destination:shop.shopMode,targetShopId:shop.shopId});return {...item,category:shop.storeMode==='niche'?shop.nicheName||'Other':item.category};}
export async function publishStudioProduct(item:PendingShopItem,shop:Shop,storage:Storage,request:typeof fetch=fetch){
 let current=shop;try{const saved=storage.getItem(shopDraftKey(shop));if(saved)current=validateShop({...JSON.parse(saved),shopId:shop.shopId,shopMode:shop.shopMode,customSlug:shop.customSlug,storeMode:shop.storeMode});}catch{}storage.setItem(pendingShopKey,JSON.stringify(item));const old=current.products.find(p=>p.id===item.id);const product={...old,...pendingProduct(item),category:current.storeMode==='niche'?current.nicheName||'Other':item.category};const next=validateShop({...current,products:[product,...current.products.filter(p=>p.id!==item.id)]});persistShop(next,storage);storage.removeItem(pendingShopKey);
 const response=await request('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(storage)},body:JSON.stringify(next)});if(!response.ok)throw Error('PUBLISH_FAILED');return response.json();
}
