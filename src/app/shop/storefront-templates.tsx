"use client";
import {featuredProduct} from '../../lib/storefront-selection';
import ProductPrice from './product-price';
import PromoVideoModal from './promo-video-modal';
import {promoVideo} from './promo-video';
import {stockMetadata} from './stock-photos';
import {extractProductIdentity,isStudioCover} from './product-identity';
import {isAmazonDestination,amazonAffiliateProduct} from './affiliate-compliance';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowUpRight,ArrowRight,ShieldCheck,ShoppingBag,Eye,Check,Truck,Layers} from 'lucide-react';
import {useLanguage} from '../language-context';
import {translations,type Message} from '../translations';
import type {Product,Shop} from './shop-data';
import {safeUrl,safeImage,categories} from './shop-data';
import {dealDiscount,productHighlights} from './storefront-style';
import {productPath} from './product-links';
import ProductGallery from './product-gallery';
import {escrowReady,holdDays} from './escrow-config';

export function StorefrontHero({shop,verified=false,products=shop.products,filtered=false}:{shop:Shop;verified?:boolean;products?:Product[];filtered?:boolean}){
 const {t}=useLanguage(),affiliate=shop.shopMode==='affiliate',photo=filtered?featuredProduct(products)?.image:safeImage(shop.heroImage||'')||featuredProduct(products)?.image;
 return <section className={affiliate?'curator-hero':'boutique-hero'} data-template={affiliate?'editorial':'boutique'}>
  <div className="store-hero-copy">{shop.storeMode==='niche'&&<span className="mb-4 inline-flex rounded-full border px-4 py-2 text-sm font-bold" aria-label={t('Niche Collection')}>{shop.nicheName}</span>}<p className="store-eyebrow">{affiliate?<Layers size={15}/>:<ShoppingBag size={15}/>} {t(affiliate?'The Curated Edit':'The Signature Collection')}</p><h2>{shop.heroTitle||(shop.storeMode==='niche'?shop.nicheName:undefined)||t(affiliate?'Top Curated Picks & Fresh Finds':'Everyday pieces. Exceptionally yours.')}</h2><p className="store-hero-description">{shop.heroSubtitle||shop.bio||t(affiliate?'A considered collection of useful finds. Explore the details, compare the value, and shop directly with the original store.':'Discover the collection, find your next favorite, and order directly from our boutique.')}</p><a href="#store-collection" className="store-primary-link">{t(affiliate?'Explore the edit':'Shop the collection')}<ArrowRight size={17}/></a><p className="store-hero-fine">{affiliate?t('Prices and availability are set by each external store.'):t('Your collection. Your way to pay.')}</p></div>
  <div className="store-hero-art">{photo?<img src={photo} alt={shop.name} className={shop.heroImage?'custom-hero-photo':''}/>:<div className="store-monogram" aria-hidden="true">{(shop.name||'SP').slice(0,2).toUpperCase()}</div>}<span className="store-hero-stamp">{affiliate?t('Selected with care'):shop.name||t('My Shop')}</span></div>
  {!affiliate&&<div className="boutique-trust-strip">{verified&&<span><ShieldCheck size={17}/>{t('Verified Store')}</span>}{shop.escrowEnabled!==false&&shop.escrowGovernance!=='off'&&<span><ShieldCheck size={17}/>{t('Escrow Buyer Protection')} · {holdDays(shop.escrowHoldDays)} {t('days')}{!escrowReady&&<small> · {t('Preview')}</small>}</span>}{shop.escrowEnabled!==false&&<span>{t('Pay with USDC')}</span>}{shop.codEnabled!==false&&<span><Truck size={17}/>{t('Cash on Delivery (COD)')}</span>}</div>}
 </section>;
}
type Props={shop:Shop;products:Product[];slug?:string;snapshot?:string;onAdd:(p:Product,quantity:number)=>void;onPay:(p:Product,quantity:number)=>void;onCod:(p:Product,quantity:number)=>void;onShare?:(p:Product)=>void;management?:(p:Product)=>ReactNode};
export function StorefrontProducts({shop,products,slug,snapshot,onAdd,onPay,onCod,onShare,management}:Props){
 const {t}=useLanguage(),affiliate=shop.shopMode==='affiliate',[quick,setQuick]=useState<Product|null>(null),[demo,setDemo]=useState(''),[added,setAdded]=useState('');
 const addedTimer=useRef<ReturnType<typeof setTimeout>|null>(null);useEffect(()=>()=>{if(addedTimer.current)clearTimeout(addedTimer.current);},[]);
 function addProduct(p:Product,quantity:number){onAdd(p,quantity);setAdded(p.id);if(addedTimer.current)clearTimeout(addedTimer.current);addedTimer.current=setTimeout(()=>setAdded(''),1800);}
 const title=(p:Product)=>p.id.startsWith('sample-')&&p.name in translations?t(p.name as Message):p.name;
 return <><div className={(affiliate?'editorial-products':'boutique-products')+' grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>{products.map((p,index)=>{
  const identity=extractProductIdentity(p.identityOverride||p.name,p.category),amazon=affiliate&&isAmazonDestination(p.url),restricted=affiliate&&amazonAffiliateProduct(p),discount=restricted?null:dealDiscount(p),soldOut=p.stock===0,highlights=productHighlights(p.keyHighlights?.length?p.keyHighlights.join('\n'):p.description),stockPhoto=stockMetadata(p.stockPhoto,p.image);
  return <article id={'product-'+p.id} key={p.id} className={affiliate?'editorial-product'+(stockPhoto?' has-representative-photo':''):'boutique-product'}>
   <div className="store-card-visual aspect-[4/3] max-h-56 w-full"><span className="store-card-number">{String(index+1).padStart(2,'0')} / {t(affiliate?'THE EDIT':'COLLECTION')}</span>
    {affiliate?<div className="store-photo-frame h-full w-full">{p.image&&<img className="h-full w-full object-contain object-center" src={p.image} alt={title(p)} loading="lazy"/>}</div>:<a href={productPath(p.id,slug,snapshot)} className="store-photo-frame h-full w-full" aria-label={title(p)}>{p.image&&<img className="h-full w-full object-contain object-center" src={p.image} alt={title(p)} loading="lazy"/>}</a>}
    {p.aiGeneratedImage&&<span className="studio-cover-caption">{t('Representative AI image — not the exact branded product.')}</span>}{discount&&<span className="store-deal-badge">-{discount}%</span>}{!restricted&&p.badge&&p.badge!=='none'&&<span className="store-feature-badge">{t(p.badge==='hot'?'Hot':p.badge==='sale'?'Sale':p.badge==='limited'?'Limited':'New')}</span>}{!affiliate&&<button className="store-quick-view" type="button" onClick={()=>setQuick(p)}><Eye size={16}/>{t('Quick View')}</button>}
   </div>
   <div className="store-card-body p-4">
    {affiliate&&stockPhoto&&<div className="store-photo-credit"><a href={stockPhoto.pageUrl} target="_blank" rel="noopener noreferrer">{t('Photo credit')}: {stockPhoto.photographer==='Pexels contributor'?t('Pexels contributor'):stockPhoto.photographer} / {stockPhoto.provider}</a></div>}
    <p className="store-eyebrow">{categories.includes(p.category as typeof categories[number])?t(p.category as Message):p.category}{affiliate&&p.source?' · '+p.source:''}</p>
    <h3 className="line-clamp-2">{affiliate?(p.id.startsWith('sample-')?title(p):identity.confidence==='matched'?identity.coreName:title(p)):<a href={productPath(p.id,slug,snapshot)}>{title(p)}</a>}</h3>
    <ProductPrice product={p} mode={shop.shopMode}/>
    {affiliate?<ul className="store-highlights">{highlights.slice(0,1).map((line,i)=><li key={i}><Check size={15}/><span className="line-clamp-1">{line}</span></li>)}</ul>:<><p className="store-card-description line-clamp-1">{highlights[0]||p.description}</p>{p.stock!==undefined&&<p className="store-stock">{soldOut?t('Sold Out'):p.stock+' '+t('available')}</p>}</>}
    <div className="store-card-actions">
     {affiliate?<div className="store-primary-action">{safeUrl(p.url)&&<a className="store-buy-button" href={safeUrl(p.url)} target="_blank" rel="nofollow sponsored noopener noreferrer">{t(amazon?'Check Price on Amazon':'View Best Deal')}<ArrowUpRight size={18}/></a>}</div>:<><div className="store-personal-actions"><button type="button" disabled={soldOut} className="store-buy-button" onClick={()=>addProduct(p,1)} aria-live="polite" data-state={added===p.id?'saved':undefined}>{added===p.id?<Check size={16}/>:<ShoppingBag size={16}/>} {t(added===p.id?'Added to Cart':'Add to Cart')}</button><a className="store-detail-link" href={productPath(p.id,slug,snapshot)}>{t('View Product')}<ArrowRight size={16}/></a></div><div className="store-payment-links"><button type="button" disabled={soldOut} onClick={()=>p.variants?.length?location.assign(productPath(p.id,slug,snapshot)):onPay(p,1)}>{t('Payment Options')}</button>{shop.escrowEnabled!==false&&<button type="button" disabled={soldOut} onClick={()=>p.variants?.length?location.assign(productPath(p.id,slug,snapshot)):onPay(p,1)}>{t('Pay with USDC')}</button>}{shop.codEnabled!==false&&<button type="button" disabled={soldOut} onClick={()=>p.variants?.length?location.assign(productPath(p.id,slug,snapshot)):onCod(p,1)}>{t('Cash on Delivery (COD)')}</button>}</div></>}
     <button type="button" className="store-share-action text-sm font-semibold text-emerald-800 underline underline-offset-4" onClick={()=>onShare?.(p)}>{t('Copy / Share Link')}</button>
     {promoVideo(p.promo_video_url)&&<div className="store-video-slot"><button type="button" className="rounded-full border border-emerald-600 px-3 py-2 text-sm font-bold text-emerald-800" onClick={()=>setDemo(p.promo_video_url!)}>{t('Watch Demo')}</button></div>}
     {management&&<div className="mt-1 flex flex-wrap gap-2 border-t pt-2 text-xs">{management(p)}</div>}
    </div>
   </div>
  </article>;
 })}</div>{demo&&<PromoVideoModal url={demo} onClose={()=>setDemo('')}/>} {quick&&!affiliate&&<QuickView shop={shop} product={quick} slug={slug} snapshot={snapshot} onClose={()=>setQuick(null)} onAdd={onAdd} onPay={onPay} onCod={onCod}/>}</>;
}

function QuickView({shop,product,slug,snapshot,onClose,onAdd,onPay,onCod}:Omit<Props,'products'|'management'>&{product:Product;onClose:()=>void}){
 const {t}=useLanguage(),dialog=useRef<HTMLDialogElement>(null),[quantity,setQuantity]=useState(1),[added,setAdded]=useState(false),maximum=Math.max(1,Math.min(99,product.stock??99));
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} onClose={onClose} aria-label={t('Quick View')} className="store-quick-dialog"><button type="button" className="mb-5 rounded-xl border px-4 py-2" onClick={()=>dialog.current?.close()}>{t('Close')}</button><div className="grid gap-7 md:grid-cols-2"><ProductGallery images={[product.image,...(product.images||[])].filter(Boolean)} title={product.name}/><div><p className="store-eyebrow">{t('The Signature Collection')}</p><h2 className="mt-4 text-3xl font-bold">{product.id.startsWith('sample-')&&product.name in translations?t(product.name as Message):product.name}</h2><p className="my-5 text-2xl font-bold">{product.price}</p><p className="mb-5 whitespace-pre-line text-slate-600">{product.description}</p><label className="block">{t('Quantity')}<input type="number" min={1} max={maximum} value={quantity} onChange={e=>setQuantity(Math.min(maximum,Math.max(1,Math.trunc(+e.target.value)||1)))} className="mx-3 w-20 rounded-lg border p-2"/></label><button disabled={product.stock===0} className="store-buy-button my-5" onClick={()=>{onAdd(product,quantity);setAdded(true);}}>{t('Add to Cart')}</button>{added&&<p role="status">{t('Added to Cart')}</p>}<div className="store-payment-links"><button type="button" disabled={product.stock===0} onClick={()=>{onClose();if(product.variants?.length)location.assign(productPath(product.id,slug,snapshot));else onPay(product,quantity);}}>{t("Payment Options")}</button>{shop.escrowEnabled!==false&&<button disabled={product.stock===0} onClick={()=>{onClose();if(product.variants?.length)location.assign(productPath(product.id,slug,snapshot));else onPay(product,quantity);}}>{t('Pay with USDC')}</button>}{shop.codEnabled!==false&&<button disabled={product.stock===0} onClick={()=>{onClose();if(product.variants?.length)location.assign(productPath(product.id,slug,snapshot));else onCod(product,quantity);}}>{t('Cash on Delivery (COD)')}</button>}</div><a className="store-detail-link mt-5" href={productPath(product.id,slug,snapshot)}>{t('View Product')}<ArrowRight size={16}/></a></div></div></dialog>;
}
