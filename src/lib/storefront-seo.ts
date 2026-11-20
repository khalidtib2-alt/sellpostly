import type {Metadata} from 'next';
import type {Shop,ShopMode} from '../app/shop/shop-data';
import {productShareUrl,storePath,productPath} from '../app/shop/product-links';
const clean=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function storefrontMetadata(slug:string,mode:ShopMode,shop:(Shop&{suspended?:boolean})|null):Metadata{
 const url=productShareUrl(storePath(slug,mode));
 if(!shop||shop.suspended)return {title:shop?.suspended?'Store unavailable | SellPostly':'Store not found | SellPostly',alternates:{canonical:url},robots:{index:false,follow:false},openGraph:null,twitter:null};
 const title=clean(shop.name||'SellPostly')+' | '+(mode==='affiliate'?'Affiliate Deals':'Personal Store');
 const description=clean(shop.bio||shop.heroSubtitle|| (mode==='affiliate'?'Explore curated picks and visit partner stores for current prices and availability.':'Explore this seller’s collection, product details and available ordering options.')).slice(0,180);
 const image={url:url+'/opengraph-image',width:1200,height:630,alt:clean(shop.name||'SellPostly')+' storefront'};
 return {title,description,alternates:{canonical:url},robots:{index:true,follow:true},openGraph:{type:'website',siteName:'SellPostly',url,title,description,images:[image]},twitter:{card:'summary_large_image',title,description,images:[image.url]}};
}
export function cardShareUrl(mode:ShopMode,id:string,slug?:string,snapshot?:string){
 if(mode==='personal')return productShareUrl(productPath(id,slug,snapshot));
 const store=slug?storePath(slug,'affiliate'):'/shop'+(snapshot?'?'+new URLSearchParams({s:snapshot}):'');
 return productShareUrl(store+'#product-'+encodeURIComponent(id));
}
