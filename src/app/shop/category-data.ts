import type {Shop} from './shop-data';
import {publicDigitalProduct} from './digital-data';
export const builtInCategories=['All','Tech & Gadgets','Fashion','Home & Kitchen','Beauty','Fitness','Top Deals','Digital Product','Art','Sport','Other'] as const;
export const cleanCategory=(value:unknown)=>typeof value==='string'?value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80):'';
export const categoryKey=(value:unknown)=>cleanCategory(value).toLowerCase();
export function normalizeCustomCategories(raw:unknown,products:{category?:unknown}[]=[]){
 const seen=new Set(builtInCategories.map(categoryKey)),names:string[]=[];
 for(const value of [...(Array.isArray(raw)?raw:[]),...products.map(p=>p?.category)]){const name=cleanCategory(value),key=categoryKey(name);if(name&&!seen.has(key)){seen.add(key);names.push(name);if(names.length===500)break;}}
 return names;
}
export function categoryOptions(shop:Pick<Shop,'products'|'customCategories'>,includeEmpty=false){
 const counts=new Map<string,number>();for(const p of shop.products){const key=categoryKey(p.category);counts.set(key,(counts.get(key)||0)+1);}
 return [...builtInCategories,...normalizeCustomCategories(shop.customCategories,shop.products)].map(name=>({name,count:name==='All'?shop.products.length:counts.get(categoryKey(name))||0})).filter(row=>row.name==='All'||includeEmpty||row.count>0);
}
export function activeCategory(shop:Pick<Shop,'products'|'customCategories'>,selected:string,hideEmpty:boolean){
 const row=categoryOptions(shop,!hideEmpty).find(c=>categoryKey(c.name)===categoryKey(selected));return row?.name||'All';
}
export function addCustomCategory(shop:Shop,value:string):Shop{const name=cleanCategory(value);if(!name)throw Error('CATEGORY_REQUIRED');if(categoryOptions(shop,true).some(c=>categoryKey(c.name)===categoryKey(name)))throw Error('CATEGORY_EXISTS');if((shop.customCategories?.length||0)>=500)throw Error('CATEGORY_LIMIT');return {...shop,customCategories:[...normalizeCustomCategories(shop.customCategories,shop.products),name]};}
export function catalogExport(shop:Shop){return {version:1,name:shop.name,shopMode:shop.shopMode,categories:categoryOptions(shop,true).filter(c=>c.name!=='All').map(c=>c.name),customCategories:normalizeCustomCategories(shop.customCategories,shop.products),products:shop.products.map(publicDigitalProduct)};}
export function catalogFilename(shop:Shop){return (shop.customSlug||shop.name||'sellpostly-catalog').normalize('NFKC').replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,80)+'.json';}
