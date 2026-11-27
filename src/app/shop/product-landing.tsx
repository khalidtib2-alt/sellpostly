'use client';
import {catalogImageLimit} from '../../lib/external-catalog-data';
import {useState} from 'react';
import {useLanguage} from '../language-context';
import {translations,type Message} from '../translations';
import {categories,safeImage,safeUrl,type Shop,type Product} from './shop-data';
import {shopHeaders} from './multi-shop-data';
import {useShopCart} from './use-shop-cart';
import {productPath,productShareUrl,storePath} from './product-links';
import {StorefrontVisit} from './storefront-visit';
import {VariantPicker} from './variant-controls';
import type {OrderItem} from './inventory-data';
import {cartTotal,catalogCartLines,cartLineKey,moveCartVariant,type CartLine} from './cart-data';
import {productCheckout} from './product-checkout';
import {productSavings} from './product-offer';
import {productHighlights} from './storefront-style';
import ProductPrice from './product-price';
import CartDrawer from './cart-drawer';
import CryptoCheckout from './peer-checkout';
import CodCheckout from './cod-checkout';
import ProductGallery from './product-gallery';
import ShopLogo from './shop-logo';
import StorePolicy from './store-policy';
import SocialShareBar from './social-share-bar';
import ShareModal from './share-modal';
import BuyerStoreFooter from './buyer-store-footer';
import PromoVideoModal from './promo-video-modal';
import {promoVideo} from './promo-video';
import {normalizePayments,paymentMethods,paymentLabels,methodReady} from './payment-config';
import {amazonAffiliateProduct,isAmazonDestination,disclosurePresets} from './affiliate-compliance';
import {escrowReady,holdDays} from './escrow-config';
export default function ProductLanding({shop,productId,slug,snapshot,verified=false}:{shop:Shop;productId:string;slug?:string;snapshot?:string;verified?:boolean}){
 const {t,language,setLanguage}=useLanguage(),[quantity,setQuantity]=useState(1),[variantId,setVariantId]=useState<string>(),[cartOpen,setCartOpen]=useState(false),[checkout,setCheckout]=useState<{product:Product;details:string;items:OrderItem[]}|null>(null),[status,setStatus]=useState<Message|''>(''),[copying,setCopying]=useState(false),[demo,setDemo]=useState(''),[shareUrl,setShareUrl]=useState(''),[resolvedUrl,setResolvedUrl]=useState(''),[codLines,setCodLines]=useState<CartLine[]|null>(null);
 const affiliate=shop.shopMode==='affiliate',[cart,setCart]=useShopCart(shop,slug,snapshot,!affiliate),product=shop.products.find(p=>p.id===productId&&(!p.catalogMode||p.catalogMode===shop.shopMode));
 if(!product)return <main className="mx-auto max-w-3xl p-8"><p>{t('Product Not Found')}</p><a href={slug?storePath(slug,shop.shopMode):'/shop'}>{t('Back to Store')}</a></main>;
 const variants=affiliate?[]:product.variants||[],variant=variants.find(row=>row.id===variantId),available=variant?.stockCount??product.stock;
 const maximum=Math.max(1,Math.min(99,available??99)),restricted=affiliate&&amazonAffiliateProduct(product),offer=restricted?null:productSavings(product),merchant=safeUrl(product.url),soldOut=available===0,blocked=soldOut||(variants.length>0&&!variant);
 const back=slug?storePath(slug,shop.shopMode):'/shop'+(snapshot?'?'+new URLSearchParams({s:snapshot}):'?mode='+shop.shopMode);
 const link=(id:string,published=slug)=>{const path=productPath(id,published,snapshot);return path+(affiliate?(path.includes('?')?'&':'?')+'type=affiliate':'');};
 const publicUrl=resolvedUrl||(slug||snapshot?productShareUrl(link(product.id)):'');
 const lines=catalogCartLines(shop.products,cart),total=cartTotal(lines),count=lines.reduce((n,line)=>n+line.quantity,0);
 const photos=[...new Set([product.image,...(product.images||[])].map(safeImage).filter(Boolean))].slice(0,product.importSourceUrl!==undefined||product.variantOptions!==undefined?catalogImageLimit:9);
 const paragraphs=(product.description||'').split(/\n+/).map(line=>line.trim()).filter(Boolean),highlights=(product.keyHighlights?.length?product.keyHighlights:productHighlights(product.description)).slice(0,5);
 const name=(p:Product)=>p.id.startsWith('sample-')&&p.name in translations?t(p.name as Message):p.name,title=name(product),button='product-primary-cta disabled:opacity-50';
 const payments=normalizePayments(shop.payments,shop),enabled=affiliate?[]:paymentMethods.filter(method=>methodReady(payments,method,method==='USDC_DIRECT'&&shop.escrowGovernance!=='off'&&escrowReady));
 const related=shop.products.filter(p=>p.id!==product.id&&(!p.catalogMode||p.catalogMode===shop.shopMode)).sort((a,b)=>Number(b.category===product.category)-Number(a.category===product.category)).slice(0,4);
 const disclosure=shop.affiliateDisclosure||disclosurePresets[0].text,preset=disclosurePresets.find(item=>[item.text,translations[item.text].fr,translations[item.text].es,translations[item.text].ar].some(candidate=>candidate===disclosure));
 function change(id:string,delta:number){setCart(previous=>{const next={...previous},value=Math.min(99,Math.max(0,(previous[id]||0)+delta));if(value)next[id]=value;else delete next[id];return next;});}
 function add(order=false){
  if(affiliate||blocked)return;
  const key=cartLineKey(product!.id,variant?.id);
  if(quantity+(cart[key]||0)>Math.min(99,available??99)){setStatus('Not enough stock.');return;}
  change(key,quantity);setStatus('Added to Cart');
  if(order)setCheckout(productCheckout(product!,quantity,variant));
 }
 async function copy(){setCopying(true);try{let published=slug;if(!published&&!snapshot){const response=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify(shop)});if(!response.ok)throw Error();published=(await response.json()).slug;if(!published)throw Error();}const url=productShareUrl(link(product!.id,published));setResolvedUrl(url);setShareUrl(url);}catch{setStatus('Publish your shop to create a shareable product link.');}finally{setCopying(false);}}
 return <main data-surface={shop.shopTheme} data-accent={shop.shopAccent} className="shop-surface product-landing mx-auto min-h-screen max-w-7xl px-5 pb-32 pt-6">
 {!affiliate&&<StorefrontVisit slug={slug}/>}
 <header className="product-store-header"><a href={back} className="flex items-center gap-3"><ShopLogo logo={shop.logo} name={shop.name}/><span><strong className="block text-xl">{shop.name}</strong>{verified&&<span className="text-sm text-emerald-700">✓ {t('Verified Store')}</span>}</span></a><div className="flex flex-wrap items-center gap-3"><div aria-label={t('Language')} className="flex rounded-full border p-1">{(['en','fr','es','ar'] as const).map(code=><button key={code} type="button" aria-pressed={language===code} onClick={()=>setLanguage(code)} className={language===code?'rounded-full bg-emerald-700 px-3 py-2 text-white':'px-3 py-2'}>{code.toUpperCase()}</button>)}</div>{!affiliate&&<button type="button" onClick={()=>setCartOpen(true)} className="rounded-xl border px-4 py-2 font-semibold">{t('Cart')} ({count})</button>}</div></header>
 <nav aria-label={t('Breadcrumb')} className="mb-6 text-sm"><a href={back} className="underline">← {t('Back to Store')}</a><span className="mx-2">/</span><span>{title}</span></nav>
 <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14"><div className="product-hero-card"><ProductGallery images={photos} title={title}/>{offer&&offer.percent>0&&<span className="product-deal-badge">−{offer.percent}%</span>}{!restricted&&product.badge&&product.badge!=='none'&&<span className="product-feature-badge">{t(product.badge==='hot'?'Hot':product.badge==='sale'?'Sale':product.badge==='limited'?'Limited':'New')}</span>}{promoVideo(product.promo_video_url)&&<button type="button" className="product-demo-button" onClick={()=>setDemo(product.promo_video_url!)}>▶ {t('Watch Demo')}</button>}</div>
 <section className="product-sales-panel"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border px-3 py-1 text-sm">{categories.includes(product.category as typeof categories[number])?t(product.category as Message):product.category}</span><span className="rounded-full border px-3 py-1 text-sm">{t(product.gender==='men'?'Men':product.gender==='women'?'Women':product.gender==='kids'?'Kids':'Unisex')}</span></div><h1 className="text-3xl font-black leading-tight sm:text-5xl">{title}</h1>
 <div className="product-price-block"><ProductPrice product={product} mode={shop.shopMode}/>{offer&&<p className="product-savings">{t('You save')} {new Intl.NumberFormat(language,{maximumFractionDigits:2}).format(offer.amount)} {offer.currency}{offer.percent>0?' ('+offer.percent+'%)':''}</p>}</div>
 {!affiliate&&<VariantPicker variants={variants} value={variantId} onChange={id=>{setVariantId(id);setQuantity(1);}}/>}
 {!affiliate&&!variants.length&&!!product.variantOptions?.length&&<dl className="my-4 space-y-2 text-sm">
  {product.variantOptions.map((option,index)=><div key={index} dir="auto"><dt className="font-semibold">{option.name}</dt><dd>{option.values.join(', ')}</dd></div>)}
 </dl>}
 {highlights.length>0&&<section className="product-key-highlights"><h2>{t('Product Highlights')}</h2><ul>{highlights.map((line,i)=><li key={i} dir="auto"><span aria-hidden="true">✓</span>{line}</li>)}</ul></section>}
 <div className="product-checkout-trust" aria-label={t('Checkout details')}>{affiliate?<><strong>↗ {t('Partner merchant checkout')}</strong><p>{t('Confirm the current price, delivery and return policy on the merchant website.')}</p></>:<><strong>{t('Available payment methods')}</strong><div className="product-payment-badges">{enabled.map(method=><span key={method}>{t(paymentLabels[method] as Message)}</span>)}</div>{enabled.includes('USDC_DIRECT')&&shop.escrowGovernance!=='off'&&escrowReady&&<p>{t('USDC escrow is available when selected at checkout.')} · {holdDays(shop.escrowHoldDays)} {t('days')}</p>}{!enabled.length&&<p>{t('The seller has not configured payment methods yet.')}</p>}</>}</div>
 {affiliate?<>{merchant&&<a href={merchant} target="_blank" rel="nofollow sponsored noopener noreferrer" className={button}>{t(isAmazonDestination(product.url)?'Check Price on Amazon':'View Best Deal')} ↗</a>}</>:<><label className="my-4 flex items-center gap-4 font-semibold" htmlFor="product-quantity">{t('Quantity')}<input id="product-quantity" type="number" min={1} max={maximum} value={quantity} onChange={e=>setQuantity(Math.min(maximum,Math.max(1,Math.trunc(Number(e.target.value))||1)))} className="w-24 rounded-lg border bg-white p-3 text-slate-900"/></label><button type="button" disabled={blocked} className={button} onClick={()=>add(true)}>{t('Order Now')}</button></>}
 <SocialShareBar heading="Share Product" url={publicUrl} title={title} image={product.image}/>
 {!affiliate&&<><button type="button" disabled={blocked} className="product-secondary-cta" onClick={()=>add()}>{t('Add to Cart')}</button><div className="my-3 flex flex-wrap gap-3">{payments.USDC_DIRECT.enabled&&<button type="button" className="rounded-xl border px-4 py-3 font-bold" disabled={blocked} onClick={()=>add(true)}>{t('Pay with USDC')}</button>}{payments.COD.enabled&&<button type="button" className="rounded-xl border px-4 py-3 font-bold" disabled={blocked} onClick={()=>setCodLines([{product,quantity,variant}])}>{t('Cash on Delivery (COD)')}</button>}</div><StorePolicy shop={shop}/><p className="my-3 text-sm">{t('Delivery fees are confirmed by the seller.')}</p></>}
 {affiliate&&<aside className="my-4 rounded-xl border p-4 text-sm"><strong>{t('Affiliate Disclosure')}: </strong>{preset?t(preset.text):disclosure}</aside>}{!affiliate&&soldOut&&<p className="my-3 font-semibold">{t('Sold Out')}</p>}<button type="button" disabled={copying} className="my-3 text-sm font-semibold underline disabled:opacity-50" onClick={()=>void copy()}>{t('Share Product')}</button>{status&&<p role="status" className="mt-3 rounded-xl border p-3 text-sm">{t(status)}</p>}
 </section></div>
 {paragraphs.length>0&&<section className="my-12 max-w-4xl"><h2 className="mb-5 text-2xl font-bold">{t('Product Details')}</h2><div className="space-y-4 text-base leading-relaxed">{paragraphs.map((line,i)=><p key={i} dir="auto" className="whitespace-pre-wrap">{line}</p>)}</div></section>}
 {related.length>0&&<section className="product-related"><h2>{t('More From This Store')}</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(p=><article key={p.id}><a href={link(p.id)} className="product-related-photo">{p.image&&<img src={p.image} alt={name(p)} loading="lazy"/>}</a><h3><a href={link(p.id)}>{name(p)}</a></h3><ProductPrice product={p} mode={shop.shopMode}/>{affiliate&&safeUrl(p.url)?<a className="product-related-cta" href={safeUrl(p.url)} target="_blank" rel="nofollow sponsored noopener noreferrer">{t(isAmazonDestination(p.url)?'Check Price on Amazon':'View Best Deal')}</a>:<a className="product-related-cta" href={link(p.id)}>{t('View Product')}</a>}</article>)}</div></section>}
 <div className="product-mobile-cta"><div><p className="max-w-40 truncate text-xs">{title}</p>{!restricted&&<p className="font-black">{product.price}</p>}</div>{affiliate?<>{merchant&&<a href={merchant} target="_blank" rel="nofollow sponsored noopener noreferrer" className={button}>{t(isAmazonDestination(product.url)?'Check Price on Amazon':'View Best Deal')}</a>}</>:<button type="button" disabled={blocked} className={button} onClick={()=>add(true)}>{t('Order Now')}</button>}</div>
 {!affiliate&&cartOpen&&<CartDrawer isSharedBuyerView lines={lines} shop={shop} onCod={()=>{setCartOpen(false);setCodLines(lines);}} change={change} onVariant={(line,id)=>setCart(previous=>moveCartVariant(previous,line,id))} onClose={()=>setCartOpen(false)} onPay={(order,details,items)=>{setCartOpen(false);setCheckout({product:order,details,items});}}/>}
 {demo&&<PromoVideoModal url={demo} onClose={()=>setDemo('')}/>} {shareUrl&&<ShareModal url={shareUrl} title={title} product onClose={()=>setShareUrl('')}/>} {!affiliate&&codLines&&enabled.includes('COD')&&<CodCheckout storeSlug={slug} shop={shop} lines={codLines} onClose={()=>setCodLines(null)}/>} {!affiliate&&checkout&&<CryptoCheckout storeSlug={slug} orderItems={checkout.items} product={checkout.product} orderDetails={checkout.details} shop={shop} onClose={()=>setCheckout(null)}/>}
 <div className="mt-12 border-t pt-6"><BuyerStoreFooter storeSlug={slug} allowDisputes={!affiliate}/></div>
 </main>;
}
