import pool from '../shop/stock-photo-pool.json';
export type SourcePhoto={id:string;title:string;image:string;thumbnail:string;creator:string;page:string;license:string;licenseUrl:string;provider:string};
export const imageCategories=['Sneakers','Watch','Skincare','Headphones','Handbag','Minimalist Studio'] as const;
export type ImageCategory=typeof imageCategories[number];
const queries:Record<ImageCategory,string>={Sneakers:'sneakers',Watch:'smartwatch',Skincare:'skincare product',Headphones:'headphones',Handbag:'handbag', 'Minimalist Studio':'minimalist studio product'};
export const imageSearchQuery=(category:ImageCategory)=>queries[category];
export function curatedPhotos(category:ImageCategory):SourcePhoto[]{
 const match:Record<ImageCategory,string[]>={Sneakers:['sneakers'],Watch:['smartwatch'],Skincare:['skincare'],Headphones:['headphones'],Handbag:['travel bag'],'Minimalist Studio':['headphones','skincare','coffee kitchen']};
 return pool.filter(p=>match[category].some(q=>p.query.includes(q))).slice(0,8).map(p=>({id:p.id,title:category,image:p.url,thumbnail:p.url,creator:p.photographer,page:p.pageUrl,license:'Pexels',licenseUrl:p.licenseUrl,provider:'SellPostly'}));
}
const clean=(value:unknown)=>typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').trim().slice(0,200):'';
const https=(value:unknown)=>{try{const u=new URL(String(value));return u.protocol==='https:'?u.href:'';}catch{return '';}};
export function openversePhotos(data:any):SourcePhoto[]{
 return (Array.isArray(data?.results)?data.results:[]).filter((p:any)=>['cc0','pdm'].includes(p.license)&&!p.mature&&https(p.url)&&https(p.foreign_landing_url)).map((p:any)=>({id:String(p.id),title:clean(p.title)||'Openverse',image:https(p.url),thumbnail:https(p.thumbnail)||https(p.url),creator:clean(p.creator),page:https(p.foreign_landing_url),license:String(p.license).toUpperCase(),licenseUrl:https(p.license_url),provider:'Openverse'})).slice(0,12);
}
export function commonsPhotos(data:any):SourcePhoto[]{
 const pages=data?.query?.pages;
 return Object.values(pages&&typeof pages==='object'?pages:{}).flatMap((p:any)=>{
  const info=p.imageinfo?.[0],m=info?.extmetadata,license=clean(m?.LicenseShortName?.value),terms=clean(m?.UsageTerms?.value);
  if(!info||!/^image\/(jpeg|png|webp)$/.test(info.mime)||!/^https:\/\/upload\.wikimedia\.org\//.test(info.thumburl||info.url)||!/(?:public domain|cc0|^pd\b)/i.test(license+' '+terms)||/non.?commercial|no derivatives/i.test(license+' '+terms))return [];
  const page=https(info.descriptionurl);if(!page)return [];
  return [{id:String(p.pageid),title:clean(p.title).replace(/^File:/,''),image:info.thumburl||info.url,thumbnail:info.thumburl||info.url,creator:clean(m?.Artist?.value),page,license,licenseUrl:https(m?.LicenseUrl?.value),provider:'Wikimedia Commons'}];
 }).slice(0,12);
}
export async function searchFreePhotos(query:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<SourcePhoto[]>{
 const q=query.trim().slice(0,150);if(!q)return [];
 async function request(url:string){const controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,10000);try{if(signal.aborted)throw new DOMException('Aborted','AbortError');const r=await fetcher(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('Search unavailable');return await r.json();}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}}
 try{const photos=openversePhotos(await request('https://api.openverse.org/v1/images/?'+new URLSearchParams({q,license:'cc0,pdm',category:'photograph',page_size:'12',mature:'false'})));if(photos.length)return photos;}catch(e){if(signal.aborted)throw e;}
 if(signal.aborted)throw new DOMException('Aborted','AbortError');
 return commonsPhotos(await request('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:q+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'24',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'2048'})));
}
export function clipboardImage(event:Pick<ClipboardEvent,'clipboardData'>){return Array.from(event.clipboardData?.items||[]).find(item=>/^image\/(png|jpeg|webp)$/.test(item.type))?.getAsFile()||null;}
