import pool from './stock-photo-pool.json';
import {unbrandedQuery,footwearSubtype,type FootwearSubtype} from './unbranded-query';
export type StockPhoto={footwearSubtype?:FootwearSubtype;audiences?:string[];id:string;url:string;provider:'Pexels'|'Unsplash';photographer:string;pageUrl:string;photographerUrl?:string;licenseUrl:string};
export function localPhotos(query:string):StockPhoto[]{
 const key=unbrandedQuery(query)==='wireless noise cancelling headphones'?'wireless headphones':unbrandedQuery(query);
 const subtype=footwearSubtype(key),audience=key.startsWith('kids ')?'kids':key.startsWith('women ')?'women':'men';
 if(subtype)return (pool as StockPhoto[]).filter(p=>p.footwearSubtype===subtype&&(subtype!=='sneakers'||p.audiences?.includes(audience)));
 if(key==='footwear')return (pool as StockPhoto[]).filter(p=>p.footwearSubtype);
 return pool.filter(p=>p.query===key) as StockPhoto[];
}
export function isLocalStock(value:string){return pool.some(p=>p.url===value);}
export function localPhoto(value:string){return pool.find(p=>p.url===value) as StockPhoto|undefined;}
export function defaultStock(title:string,category='',gender='unisex'){return localPhotos(unbrandedQuery(title,category,gender))[0];}
const https=(value:unknown,hosts:string[])=>{try{const u=new URL(String(value));return u.protocol==='https:'&&hosts.includes(u.hostname)?u.href:'';}catch{return '';}};
/** Only provider metadata matching the actual image survives persisted/shared catalogs. */
export function stockMetadata(raw:unknown,image:string):StockPhoto|undefined{
 const local=localPhoto(image);if(local)return local;
 if(!raw||typeof raw!=='object')return;
 const p=raw as StockPhoto,pexels=p.provider==='Pexels',unsplash=p.provider==='Unsplash';if(!pexels&&!unsplash)return;
 const url=https(p.url,pexels?['images.pexels.com']:['images.unsplash.com']);
 const pageUrl=https(p.pageUrl,pexels?['www.pexels.com','pexels.com']:['unsplash.com']);
 if(!url||url!==image||!pageUrl)return;
 return {footwearSubtype:['sneakers','boots','formal','flats','sandals'].includes(p.footwearSubtype||'')?p.footwearSubtype:undefined,id:String(p.id).slice(0,100),url,provider:p.provider,photographer:String(p.photographer||p.provider).slice(0,100),pageUrl,photographerUrl:https(p.photographerUrl,pexels?['www.pexels.com','pexels.com']:['unsplash.com']),licenseUrl:pexels?'https://www.pexels.com/license/':'https://unsplash.com/license'};
}
export async function resolvePhotos(query:string,signal?:AbortSignal):Promise<StockPhoto[]>{
 try{const r=await fetch('/api/affiliate/stock-photo?'+new URLSearchParams({q:unbrandedQuery(query)}),{signal});if(!r.ok)throw Error();const data=await r.json();const valid=Array.isArray(data.photos)?data.photos.map((p:StockPhoto)=>stockMetadata(p,p.url)).filter(Boolean):[];return valid.length?valid:localPhotos(query);}catch(e){if(signal?.aborted)throw e;return localPhotos(query);}
}
export async function selectStock(photo:StockPhoto,query:string){
 // Unsplash requires tracking an image selection; never expose its access key.
 if(photo.provider==='Unsplash')await fetch('/api/affiliate/stock-photo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:unbrandedQuery(query),id:photo.id})}).then(r=>{if(!r.ok)throw Error('Photo selection unavailable');});
 return photo;
}
