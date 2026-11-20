import {persistShop,targetPendingShop} from '../app/shop/multi-shop-data';
import {unbrandedQuery} from '../app/shop/unbranded-query';
import {modeCatalogKey,switchCatalog} from '../app/shop/catalog-modes';
import { normalizeGender,safeImage,safeUrl,shopKey,validateShop,type Product,type Shop,type ShopMode } from '../app/shop/shop-data';
export const pendingShopKey='sellpostly_pending_shop_item';
export const proKey='sellpostly-pro-key';
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type PendingShopItem={targetShopId?:string;amazonImageBlocked?:boolean;unbrandedQuery?:string;destination?:ShopMode;stock?:number;id:string;title:string;price:string;image:string;description:string;url:string;category:string;gender:'unisex'|'men'|'women'|'kids';source:string};
const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
export function sourceForUrl(value:string){
 try{const host=new URL(value).hostname;
 if(/(^|\.)amazon\./i.test(host))return 'Amazon';
 if(/(^|\.)aliexpress\./i.test(host))return 'AliExpress';
 if(/(^|\.)myshopify\.com$/i.test(host))return 'Shopify';
 if(/(^|\.)(wa\.me|whatsapp\.com)$/i.test(host))return 'WhatsApp Direct';
 }catch{}return 'Other';
}
export function normalizePending(value:unknown,createId=()=>crypto.randomUUID()):PendingShopItem{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_PRODUCT');
 const raw=value as Record<string,unknown>,title=text(raw.title??raw.name,120);
 if(!title)throw Error('INVALID_PRODUCT');
 const image=typeof raw.image==='string'?raw.image:'';
 if(image.length>1500000)throw Error('IMAGE_TOO_LARGE');
 const url=safeUrl(text(raw.url,20000));
 return {targetShopId:typeof raw.targetShopId==='string'&&/^[0-9a-f-]{36}$/i.test(raw.targetShopId)?raw.targetShopId:undefined,amazonImageBlocked:raw.destination==='affiliate'&&raw.amazonImageBlocked===true,unbrandedQuery:unbrandedQuery(title,text(raw.category,80),normalizeGender(raw.gender)),destination:raw.destination==='affiliate'||raw.destination==='personal'?raw.destination:undefined,stock:typeof raw.stock==='number'&&Number.isInteger(raw.stock)&&raw.stock>=0?Math.min(raw.stock,1000000):undefined,id:text(raw.id,100)||createId(),title,price:text(raw.price,50),description:text(raw.description??raw.features,4000),image:safeImage(image),url,category:text(raw.category,80)||'Top Deals',gender:normalizeGender(raw.gender),source:text(raw.source,50)||sourceForUrl(url)};
}
export function pendingProduct(item:PendingShopItem):Product{
 return {amazonImageBlocked:item.amazonImageBlocked,unbrandedQuery:item.unbrandedQuery,stock:item.stock,catalogMode:item.destination,id:item.id,name:item.title,price:item.price,image:item.image,description:item.description,url:item.url,category:item.category,gender:item.gender,source:item.source};
}
export function consumePending(shop:Shop,storage:StorageLike){
 const saved=storage.getItem(pendingShopKey);
 if(!saved)return {shop,added:false,category:''};
 const item=normalizePending(JSON.parse(saved));
 const selected=targetPendingShop(shop,item.targetShopId,item.destination,storage);
 const target=!item.targetShopId&&item.destination&&item.destination!==selected.shopMode?switchCatalog(selected,item.destination,storage):selected;
 const product={...pendingProduct(item),catalogMode:target.shopMode,category:target.storeMode==='niche'?target.nicheName||'Other':item.category};
 // Give older pending objects a durable identity before committing the catalog.
 storage.setItem(pendingShopKey,JSON.stringify(item));
 const existing=target.products.find(p=>p.id===product.id);
 if(existing){try{storage.removeItem(pendingShopKey);}catch{}return {shop:target,added:false,category:existing.category};}
 const next=validateShop({...target,products:[product,...target.products]});
 storage.setItem(shopKey,JSON.stringify(next));
 persistShop(next,storage);
 try{storage.removeItem(pendingShopKey);}catch{}
 return {shop:next,added:true,category:next.storeMode==='niche'?'All':product.category};
}
export function importFromHash(hash:string){
 if(hash.length>300000)throw Error('IMPORT_TOO_LARGE');
 const params=new URLSearchParams(hash.replace(/^#/,''));
 const encoded=params.get('importProduct');
 if(!encoded)return null;
 const raw=JSON.parse(encoded);
 if(!raw||typeof raw.id!=='string'||!raw.id.trim())throw Error('INVALID_PRODUCT');
 const item=normalizePending(raw);
 params.delete('importProduct');
 return {item,remainingHash:params.toString()?'#'+params.toString():''};
}
export function shopPrice(raw:string,currency:string){
 const value=raw.trim();if(!value)return '';
 return /^\d[\d,.\s]*$/.test(value)&&/^[A-Z]{3}$/.test(currency)?value+' '+currency:value;
}
export async function verifyStoredPro(storage:Pick<Storage,'getItem'>,request:typeof fetch=fetch){
 try{
  const key=storage.getItem(proKey)?.trim();if(!key)return false;
  const response=await request('/api/pro/verify',{method:'POST',headers:{'x-pro-key':key},cache:'no-store'});
  const result=await response.json();return response.ok&&result.valid===true&&storage.getItem(proKey)?.trim()===key;
 }catch{return false;}
}
export async function prepareShopPhoto(value:string){
 const image=safeImage(value);if(!image.startsWith('data:')||image.length<=1400000)return image;
 return new Promise<string>((resolve,reject)=>{
  const source=new Image();
  source.onload=()=>{
   try{
    const scale=Math.min(1,1000/Math.max(source.width,source.height)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    canvas.getContext('2d')!.drawImage(source,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/webp',0.82);
    if(result.length>1400000)throw Error('IMAGE_TOO_LARGE');resolve(result);
   }catch(error){reject(error);}
  };
  source.onerror=()=>reject(Error('INVALID_IMAGE'));source.src=image;
 });
}

