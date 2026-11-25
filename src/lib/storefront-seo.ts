import {seoKeywords,type SeoLanguage} from './marketing-seo';
import type {Metadata} from 'next';
import type {Shop,ShopMode} from '../app/shop/shop-data';
import {productShareUrl,storePath,productPath} from '../app/shop/product-links';
const clean=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function storefrontMetadata(slug:string,mode:ShopMode,shop:(Shop&{suspended?:boolean})|null,language:SeoLanguage='en'):Metadata{
 const url=productShareUrl(storePath(slug,mode));
 if(!shop||shop.suspended)return {title:shop?.suspended?'Store unavailable | SellPostly':'Store not found | SellPostly',alternates:{canonical:url},robots:{index:false,follow:false},openGraph:null,twitter:null};
 const title=clean(shop.name||'SellPostly')+' | '+(language==='es'?(mode==='affiliate'?'Tienda de ofertas de afiliados':'Tienda personal'):language==='fr'?(mode==='affiliate'?'Boutique affiliée':'Boutique personnelle'):language==='ar'?(mode==='affiliate'?'متجر العروض التابعة':'المتجر الشخصي'):(mode==='affiliate'?'Affiliate Deals Shop':'Personal Store'));
 const fallback=language==='es'?(mode==='affiliate'?'Explora ofertas seleccionadas y consulta los precios actuales en los comercios asociados.':'Explora los productos y métodos de pago directo de este vendedor independiente.'):language==='fr'?(mode==='affiliate'?'Découvrez des offres affiliées et consultez les prix actuels chez les marchands partenaires.':'Découvrez les produits et paiements directs du vendeur, dont USDC et virement bancaire selon configuration.'):language==='ar'?(mode==='affiliate'?'اكتشف العروض التابعة وتحقق من الأسعار الحالية لدى التجار الشركاء.':'اكتشف منتجات البائع وخيارات الدفع المباشر بما فيها USDC والتحويل البنكي حسب الإعدادات.'):(mode==='affiliate'?'Explore curated affiliate deals and visit partner merchants for current prices.':'Explore this social commerce store and its direct payment options, including USDC and bank transfer when enabled.');
 const description=clean(shop.bio||shop.heroSubtitle||fallback).slice(0,180);
 const image={url:url+'/opengraph-image',width:1200,height:630,alt:clean(shop.name||'SellPostly')+' storefront'};
 return {title,description,keywords:seoKeywords(),alternates:{canonical:url},robots:{index:true,follow:true},openGraph:{type:'website',siteName:'SellPostly',url,title,description,locale:language==='es'?'es_ES':language==='fr'?'fr_FR':language==='ar'?'ar_MA':'en_US',alternateLocale:['en_US','fr_FR','es_ES','ar_MA'].filter(v=>v!==(language==='es'?'es_ES':language==='fr'?'fr_FR':language==='ar'?'ar_MA':'en_US')),images:[image]},twitter:{card:'summary_large_image',title,description,images:[image.url]}};
}
export function cardShareUrl(mode:ShopMode,id:string,slug?:string,snapshot?:string){
 if(mode==='personal')return productShareUrl(productPath(id,slug,snapshot));
 const store=slug?storePath(slug,'affiliate'):'/shop'+(snapshot?'?'+new URLSearchParams({s:snapshot}):'');
 return productShareUrl(store+'#product-'+encodeURIComponent(id));
}

export function storefrontSchema(slug:string,mode:ShopMode,shop:Shop,language:SeoLanguage='en'){const meta=storefrontMetadata(slug,mode,shop,language);return {'@context':'https://schema.org','@type':'CollectionPage','@id':String(meta.alternates?.canonical)+'#storefront',url:meta.alternates?.canonical,name:meta.title,description:meta.description,inLanguage:language,keywords:seoKeywords(language).join(', '),isPartOf:{'@type':'WebSite',name:'SellPostly',url:productShareUrl('/')}};}
