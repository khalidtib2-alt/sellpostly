import 'server-only';
import {localPhotos,type StockPhoto} from '../app/shop/stock-photos';
import {unbrandedQuery,footwearSubtype,matchesFootwearQuery} from '../app/shop/unbranded-query';
type Entry={photos:StockPhoto[];expires:number;downloads:Map<string,string>};
const cache=new Map<string,Entry>(),inflight=new Map<string,Promise<Entry>>();
const branded=/\b(adidas|nike|puma|apple|sony|samsung|dyson|nespresso|bose|jbl|canon|nikon|logitech|brand|logo|watermark)\b/i;
function trusted(value:unknown,host:string){try{const u=new URL(String(value));return u.protocol==='https:'&&u.hostname===host?u.href:'';}catch{return '';}}
const referral=(value:string)=>{const u=new URL(value);u.searchParams.set('utm_source','sellpostly');u.searchParams.set('utm_medium','referral');return u.href;};
async function json(url:string,headers:Record<string,string>){const r=await fetch(url,{headers,signal:AbortSignal.timeout(5000),cache:'no-store',redirect:'error'});if(!r.ok)throw Error('Photo provider unavailable');return r.json();}
export async function stockPhotos(raw:string):Promise<Entry>{
 const query=unbrandedQuery(raw),saved=cache.get(query);if(saved&&saved.expires>Date.now())return saved;
 const running=inflight.get(query);if(running)return running;
 const task=(async()=>{
  const downloads=new Map<string,string>();let photos:StockPhoto[]=[];
  if(process.env.PEXELS_API_KEY?.trim())try{
   const data=await json('https://api.pexels.com/v1/search?'+new URLSearchParams({query:query+' product minimal background',per_page:'16'}),{Authorization:process.env.PEXELS_API_KEY.trim()});
   for(const p of Array.isArray(data.photos)?data.photos:[]){
    const url=trusted(p.src?.large,'images.pexels.com'),pageUrl=trusted(p.url,'www.pexels.com');
    if(!url||!pageUrl||branded.test(p.alt||'')||!matchesFootwearQuery(query,p.alt||''))continue;
    photos.push({footwearSubtype:footwearSubtype(query),id:'pexels-'+p.id,url,provider:'Pexels',photographer:String(p.photographer||'Pexels contributor').slice(0,100),photographerUrl:trusted(p.photographer_url,'www.pexels.com'),pageUrl,licenseUrl:'https://www.pexels.com/license/'});
   }
  }catch{/* A failed provider must not prevent a local match. */}
  if(!photos.length&&process.env.UNSPLASH_ACCESS_KEY?.trim())try{
   const data=await json('https://api.unsplash.com/search/photos?'+new URLSearchParams({query:query+' product minimal background',per_page:'16',content_filter:'high'}),{Authorization:'Client-ID '+process.env.UNSPLASH_ACCESS_KEY.trim(),'Accept-Version':'v1'});
   for(const p of Array.isArray(data.results)?data.results:[]){
    const url=trusted(p.urls?.regular,'images.unsplash.com'),page=trusted(p.links?.html,'unsplash.com'),download=trusted(p.links?.download_location,'api.unsplash.com');
    if(!url||!page||!download||branded.test([p.alt_description,p.description].join(' '))||!matchesFootwearQuery(query,[p.alt_description,p.description].join(' ')))continue;
    const id='unsplash-'+String(p.id).slice(0,80);downloads.set(id,download);
    const author=trusted(p.user?.links?.html,'unsplash.com');
    photos.push({footwearSubtype:footwearSubtype(query),id,url,provider:'Unsplash',photographer:String(p.user?.name||'Unsplash contributor').slice(0,100),photographerUrl:author?referral(author):undefined,pageUrl:referral(page),licenseUrl:'https://unsplash.com/license'});
   }
  }catch{}
  const entry={photos:photos.length?photos.slice(0,12):localPhotos(query),expires:Date.now()+30*60*1000,downloads};cache.set(query,entry);return entry;
 })();inflight.set(query,task);try{return await task;}finally{inflight.delete(query);}
}
export async function trackStockSelection(query:string,id:string){
 const entry=await stockPhotos(query),photo=entry.photos.find(p=>p.id===id);if(!photo)return false;
 if(photo.provider==='Unsplash'){
  const url=entry.downloads.get(id);if(!url||!process.env.UNSPLASH_ACCESS_KEY)return false;
  try{await json(url,{Authorization:'Client-ID '+process.env.UNSPLASH_ACCESS_KEY.trim(),'Accept-Version':'v1'});}catch{return false;}
 }
 return true;
}
