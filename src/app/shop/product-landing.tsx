'use client';
import StorePolicy from './store-policy';
import PromoVideoModal from './promo-video-modal';
import {promoVideo} from './promo-video';
import ShareModal from './share-modal';
import CodCheckout from './cod-checkout';
import {useState} from 'react';
import {useLanguage} from '../language-context';
import type {Message} from '../translations';
import type {Shop,Product} from './shop-data';
import {categories,safeImage} from './shop-data';
import {shopHeaders} from './multi-shop-data';
import {useShopCart} from './use-shop-cart';
import {productPath,productShareUrl} from './product-links';
import {cartTotal} from './cart-data';
import {productCheckout} from './product-checkout';
import CartDrawer from './cart-drawer';
import CryptoCheckout from './peer-checkout';
import ProductGallery from './product-gallery';
import BuyerStoreFooter from './buyer-store-footer';
import {escrowReady,holdDays} from './escrow-config';
export default function ProductLanding({shop,productId,slug,snapshot,verified=false}:{shop:Shop;productId:string;slug?:string;snapshot?:string;verified?:boolean}){
 const {t,language,setLanguage}=useLanguage(),[quantity,setQuantity]=useState(1),[cartOpen,setCartOpen]=useState(false),[checkout,setCheckout]=useState<{product:Product;details:string;items:{id:string;quantity:number}[]}|null>(null),[status,setStatus]=useState<Message|''>(''),[copying,setCopying]=useState(false);
 const [demo,setDemo]=useState('');
 const [shareUrl,setShareUrl]=useState(''),[codLines,setCodLines]=useState<{product:Product;quantity:number}[]|null>(null);
 const [cart,setCart]=useShopCart(shop,slug,snapshot,shop.shopMode==='personal'),product=shop.shopMode==='personal'?shop.products.find(p=>p.id===productId):undefined;
 if(!product)return <main className="mx-auto max-w-3xl p-8"><p>{t('Product Not Found')}</p><a href={slug?'/s/'+encodeURIComponent(slug)+'/personal':'/shop'}>{t('Back to Store')}</a></main>;
 const maximum=Math.max(1,Math.min(99,product.stock??99));
 const back=slug?'/s/'+encodeURIComponent(slug)+'/personal':'/shop'+(snapshot?'?'+new URLSearchParams({s:snapshot}):shop.storeMode==='niche'?'':'?mode=personal');
 const lines=shop.products.filter(p=>cart[p.id]>0).map(p=>({product:p,quantity:cart[p.id]})),total=cartTotal(lines),count=lines.reduce((n,line)=>n+line.quantity,0);
 const photos=[...new Set([product.image,...(product.images||[])].map(safeImage).filter(Boolean))].slice(0,9);
 const paragraphs=(product.description||'').split(/\n+/).map(line=>line.trim()).filter(Boolean);
 const highlights=paragraphs.flatMap(line=>line.split(/[.!?؟]\s+|[•✅]/)).map(line=>line.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0,5).map(line=>line.length>180?line.slice(0,180).replace(/\s+\S*$/, '')+'.':line);
 const title=product.id.startsWith('sample-')?t(product.name as Message):product.name;
 const button='rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50';
 function change(id:string,delta:number){setCart(previous=>{const next={...previous},value=Math.min(99,Math.max(0,(previous[id]||0)+delta));if(value)next[id]=value;else delete next[id];return next;});}
 function add(order=false){if(product!.stock!==undefined&&quantity>product!.stock){setStatus('Not enough stock.');return;}change(product!.id,quantity);setStatus('Added to Cart');if(order){setCheckout(productCheckout(product!,quantity));}}
 async function copy(){
  setCopying(true);
  try{
   let published=slug;
   if(!published&&!snapshot){const response=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify(shop)});if(!response.ok)throw Error();published=(await response.json()).slug;if(!published)throw Error();}
   setShareUrl(productShareUrl(productPath(product!.id,published,snapshot)));
  }catch{setStatus('Publish your shop to create a shareable product link.');}finally{setCopying(false);}
 }
 return <main data-surface={shop.shopTheme} data-accent={shop.shopAccent} className="shop-surface mx-auto min-h-screen max-w-7xl px-5 pb-32 pt-6">
 <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5"><a href={back} className="flex items-center gap-3">{shop.logo?<img src={shop.logo} alt="" className="h-12 w-12 rounded-xl bg-white object-contain"/>:<span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 text-xl font-bold text-white">{shop.name.trim().slice(0,2).toUpperCase()}</span>}<span><span className="block text-xl font-bold">{shop.name}</span>{verified&&<span className="text-xs text-emerald-700">✓ {t("Verified Store")}</span>}</span></a><div className="flex items-center gap-3"><div aria-label={t('Language')} className="flex rounded-full border p-1">{(['en','fr','ar'] as const).map(code=><button key={code} type="button" aria-pressed={language===code} onClick={()=>setLanguage(code)} className={language===code?'rounded-full bg-emerald-700 px-3 py-1 text-white':'px-3 py-1'}>{code==='ar'?'العربية':code.toUpperCase()}</button>)}</div><button type="button" onClick={()=>setCartOpen(true)} className="rounded-xl border px-4 py-2 font-semibold">{t('Cart')} ({count})</button></div></header>
 <nav aria-label={t('Breadcrumb')} className="mb-6 text-sm"><a href={back} className="underline">← {t('Back to Store')}</a><span className="mx-2">/</span><span>{title}</span></nav>
 <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14"><ProductGallery images={photos} title={title}/>
 <section className="lg:sticky lg:top-6"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">{categories.includes(product.category as typeof categories[number])?t(product.category as Message):product.category}</span><span className="rounded-full border px-3 py-1 text-sm">{t(product.gender==='men'?'Men':product.gender==='women'?'Women':product.gender==='kids'?'Kids':'Unisex')}</span>{product.badge&&product.badge!=='none'&&<span className="rounded-full border px-3 py-1 text-sm font-bold">{t(product.badge==='hot'?'Hot':product.badge==='sale'?'Sale':product.badge==='limited'?'Limited':'New')}</span>}</div>
 <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1><div className="my-5 flex flex-wrap items-baseline gap-3"><p className="text-3xl font-black">{product.price}</p>{product.compareAtPrice&&<del className="text-lg text-slate-500">{product.compareAtPrice}</del>}</div>
 {shop.bio&&<p className="mb-5 text-slate-600">{shop.bio}</p>}
 {highlights.length>0&&<section className="my-6"><h2 className="mb-3 font-bold">{t('Product Highlights')}</h2><ul className="space-y-2">{highlights.map((line,i)=><li key={i} dir="auto" className="flex gap-3"><span aria-hidden="true" className="text-emerald-700">✓</span><span>{line}</span></li>)}</ul></section>}
 <div className="mb-5 flex items-center gap-4"><label className="font-semibold" htmlFor="product-quantity">{t('Quantity')}</label><input id="product-quantity" type="number" min={1} max={maximum} value={quantity} onChange={e=>setQuantity(Math.min(maximum,Math.max(1,Math.trunc(Number(e.target.value))||1)))} className="w-24 rounded-lg border bg-white p-3 text-slate-900"/></div>
 <div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={product.stock===0} className={button} onClick={()=>add(true)}>{t('Order Now')}</button><button type="button" className="rounded-xl border border-emerald-700 px-6 py-3 font-bold" disabled={product.stock===0} onClick={()=>add()}>{t('Add to Cart')}</button></div>
 {shop.escrowEnabled!==false&&<button type="button" className="mt-3 w-full rounded-xl border border-emerald-700 px-6 py-3 font-bold" disabled={product.stock===0} onClick={()=>add(true)}>{t('Pay with USDC')}</button>}
 {shop.codEnabled!==false&&<button type="button" className="mt-3 w-full rounded-xl border px-6 py-3 font-bold" disabled={product.stock===0} onClick={()=>setCodLines([{product,quantity}])}>{t('Cash on Delivery (COD)')}</button>}
 {product.stock===0&&<p className="my-3 font-semibold">{t('Sold Out')}</p>}
 <p className="my-3 text-sm text-slate-600">{t('Delivery fees are confirmed by the seller.')}</p>
 {shop.escrowEnabled!==false&&shop.escrowGovernance!=='off'&&<section className="my-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><h2 className="font-bold">◇ {t('Escrow Buyer Protection')}</h2>{slug&&escrowReady?<><p className="mt-2 text-sm">{t('Payments are verified and held for the store’s assigned escrow period. Report delivery problems before release.')}</p><p className="mt-2 font-semibold">{holdDays(shop.escrowHoldDays)} {t('days')} · USDC · Polygon</p></>:<p className="mt-2 text-sm">{t('Preview: publish your store to enable escrow checkout.')}</p>}</section>}
 <button type="button" disabled={copying} className="text-sm font-semibold underline disabled:opacity-50" onClick={copy}>{t('Share Product')}</button>
 {status&&<p role="status" className="mt-3 rounded-xl border p-3 text-sm">{t(status)}</p>}
 </section></div>
 {paragraphs.length>0&&<section className="my-12 max-w-4xl"><h2 className="mb-5 text-2xl font-bold">{t('Product Details')}</h2><div className="space-y-4 text-base leading-relaxed">{paragraphs.map((line,i)=><p key={i} dir="auto" className="whitespace-pre-wrap">{line}</p>)}</div></section>}
 <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t bg-white px-5 py-4 text-slate-900 shadow-lg lg:hidden" style={{paddingBottom:'max(1rem,env(safe-area-inset-bottom))'}}><div><p className="max-w-40 truncate text-xs">{title}</p><p className="font-black">{product.price}</p></div><button type="button" className={button} onClick={()=>add(true)}>{t('Order Now')}</button></div>
 {cartOpen&&<CartDrawer isSharedBuyerView={true} lines={lines} shop={shop} onCod={()=>{setCartOpen(false);setCodLines(lines);}} change={change} onClose={()=>setCartOpen(false)} onPay={(order,details,items)=>{setCartOpen(false);setCheckout({product:order,details,items});}}/>}
 {promoVideo(product.promo_video_url)&&<button type="button" className="my-4 rounded-full border px-4 py-2 font-bold" onClick={()=>setDemo(product.promo_video_url!)}>{t("Watch Demo")}</button>}
 {demo&&<PromoVideoModal url={demo} onClose={()=>setDemo('')}/>}
 {shareUrl&&<ShareModal url={shareUrl} title={title} product onClose={()=>setShareUrl('')}/>}
 {codLines&&shop.codEnabled!==false&&<CodCheckout storeSlug={slug} shop={shop} lines={codLines} onClose={()=>setCodLines(null)}/>}
 {checkout&&<CryptoCheckout storeSlug={slug} orderItems={checkout.items} product={checkout.product} orderDetails={checkout.details} shop={shop} onClose={()=>setCheckout(null)}/>}
 <div className="mt-12 border-t pt-6"><BuyerStoreFooter storeSlug={slug}/></div>
 </main>;
}



