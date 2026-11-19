"use client";
import AffiliateImageEditor from './affiliate-image-editor';
import {extractProductIdentity,studioCover,isStudioCover,type VisualNiche} from './product-identity';
import {disclosurePresets,amazonImageNotice,isAmazonCdnImage,affiliateImage,studioCategoryImage} from './affiliate-compliance';
import {translations} from '../translations';
import {StorefrontHero,StorefrontProducts} from './storefront-templates';
import {shopAccents,shopAccentNames} from './storefront-style';
import {productCheckout} from './product-checkout';
import ShareModal from './share-modal';
import CodCheckout from './cod-checkout';
import {switchCatalog,modeCatalogKey} from './catalog-modes';
import {createSampleShop,upgradeDemoPhotos} from './demo-products';
import {useShopCart} from './use-shop-cart';
import {productPath,productShareUrl,storePath} from './product-links';
import {publicLink} from "../../lib/public-url";

import { escrowReady, holdDays } from "./escrow-config";
import BuyerStoreFooter from "./buyer-store-footer";
import { consumePending,importFromHash,pendingShopKey,normalizePending } from "../../lib/shop-handoff";
import CartDrawer from "./cart-drawer";
import { cartTotal } from "./cart-data";

import CryptoCheckout from "./crypto-checkout";
import { useEffect, useState, useRef } from "react";
import { surfaces, surfaceNames, type Surface } from "../theme-picker";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import { normalizeGender, type Gender, categories, decodeShop, safeImage, safeUrl, shopKey, validateShop, dealBadges, type DealBadge, type Product, type Shop } from "./shop-data";

const field="mt-1 block w-full rounded-lg border border-slate-300 p-2";
const button="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white";
export default function ShopBuilder({isSharedBuyerView=false,initialShop,publicSlug,verifiedStore=false}:{isSharedBuyerView?:boolean;initialShop?:Shop;publicSlug?:string;verifiedStore?:boolean}){
  const {t,language,setLanguage}=useLanguage();
  const [shop,setShop]=useState<Shop>(initialShop?validateShop(initialShop):{name:"",bio:"",phone:"",shopMode:"affiliate",shopTheme:"white",products:[]});
  const [publishedSlug,setPublishedSlug]=useState(publicSlug||''),[publishing,setPublishing]=useState(false);
  const [assignedHold,setAssignedHold]=useState(holdDays(initialShop?.escrowHoldDays));
  const [policyLoaded,setPolicyLoaded]=useState(!!initialShop);
  const [loaded,setLoaded]=useState(!!initialShop),[shared,setShared]=useState(isSharedBuyerView),[preview,setPreview]=useState(isSharedBuyerView),[adding,setAdding]=useState(false);
  const [checkout,setCheckout]=useState<{product:Product;details:string;items?:{id:string;quantity:number}[]} | null>(null);

  const [cartOpen,setCartOpen]=useState(false);
  const [shareTarget,setShareTarget]=useState<{url:string;title:string;product?:boolean}|null>(null),[codLines,setCodLines]=useState<{product:Product;quantity:number}[]|null>(null);
  const [imageNotice,setImageNotice]=useState(false);
  const [draftTitle,setDraftTitle]=useState(''),[draftCategory,setDraftCategory]=useState(''),[identityOverride,setIdentityOverride]=useState(''),[editorCover,setEditorCover]=useState<VisualNiche|undefined>();
  const [editing,setEditing]=useState<Product | null>(null);
  useEffect(()=>{setDraftTitle(editing?.name||'');setDraftCategory(editing?.category||'');setIdentityOverride(editing?.identityOverride||'');setEditorCover(editing?.editorialCover);},[editing,adding]);
  const [genderFilter,setGenderFilter]=useState<Gender | "all">("all");
  const [search,setSearch]=useState("");
  const [visible,setVisible]=useState(24);
  const snapshot=typeof window==='undefined'?undefined:new URLSearchParams(location.search).get('s')||undefined;
  const [cart,setCart]=useShopCart(shop,publicSlug,snapshot,loaded&&shop.shopMode==='personal');
  const [filter,setFilter]=useState("All"),[photo,setPhoto]=useState(""),[status,setStatus]=useState<Message|"">("");
  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(initialShop){setShop(validateShop(initialShop));setShared(true);setPreview(true);setLoaded(true);return;}
      const params=new URLSearchParams(location.search);
      try{
        if(isSharedBuyerView || params.has("s")){
          const decoded=await decodeShop(params.get("s")!);if(cancelled)return;
          setShop(decoded);setShared(true);setPreview(true);
        } else {
          let initial=createSampleShop();
          try {
            const saved=localStorage.getItem(shopKey);if(saved)initial=upgradeDemoPhotos(validateShop(JSON.parse(saved)));
            const response=await fetch('/api/shops',{headers:{'x-pro-key':localStorage.getItem('sellpostly-pro-key')||''},cache:'no-store'});
            if(response.ok){const settings=await response.json();if(settings.slug)setPublishedSlug(settings.slug);for(const mode of ['affiliate','personal'] as const){const catalog=settings[mode+'_catalog'];if(catalog&&!localStorage.getItem(modeCatalogKey(mode)))localStorage.setItem(modeCatalogKey(mode),JSON.stringify(validateShop(catalog)));}if(!saved){const mode=params.get('mode')==='personal'?'personal':settings.affiliate_catalog?'affiliate':'personal';const catalog=settings[mode+'_catalog'];if(catalog)initial=validateShop(catalog);}}
          }catch{}
          if(params.get("mode")==="personal"&&initial.shopMode!=="personal")initial=switchCatalog(initial,"personal",localStorage);
          if(params.get("addTitle")){
            const destination=params.get("addDestination");if((destination==="affiliate"||destination==="personal")&&initial.shopMode!==destination)initial=switchCatalog(initial,destination,localStorage);
            setPreview(true);
            const product:Product={id:crypto.randomUUID(),name:params.get("addTitle")!.slice(0,120),price:(params.get("addPrice")||"").slice(0,50),description:(params.get("addDescription")||"").slice(0,4000),image:safeImage(params.get("addImage")||""),url:safeUrl(params.get("addUrl")||""),gender:normalizeGender(params.get("addGender")),category:(params.get("addCategory")||"Top Deals").slice(0,80),source:"Other"};
            initial.products.push(product);
            setFilter(product.category);
            try {localStorage.setItem(shopKey,JSON.stringify(initial));}catch{setStatus("Could not save. Device storage may be full.");}
            history.replaceState(null,"",location.pathname);
          }

          try {
            const consume=()=>{
              const result=consumePending(initial,localStorage);initial=result.shop;
              if(result.category)setFilter(result.category);
              if(result.added){setStatus("Product added to My Shop!");setPreview(true);}
            };
            consume();
            const incoming=importFromHash(location.hash);
            if(incoming){
              localStorage.setItem(pendingShopKey,JSON.stringify(incoming.item));
              history.replaceState(history.state,"",location.pathname+location.search+incoming.remainingHash);
              consume();
            }
          }catch{setStatus("Could not save. Device storage may be full.");}
          if(cancelled)return;setShop(validateShop(initial));
        }
      }catch{setStatus("Could not open this shop link.");}
      if(!cancelled)setLoaded(true);
    }
    load();return()=>{cancelled=true;};
  },[initialShop,isSharedBuyerView]);
  useEffect(()=>{if(loaded&&!shared)try{localStorage.setItem(shopKey,JSON.stringify(shop));localStorage.setItem(modeCatalogKey(shop.shopMode),JSON.stringify(shop));}catch{setStatus("Could not save. Device storage may be full.");}},[shop,loaded,shared]);
  useEffect(()=>{
    if(shared||!loaded)return;
    let active=true;
    async function refreshPolicy(){
      try{
        const key=localStorage.getItem("sellpostly-pro-key")||"";
        const response=await fetch("/api/shops",{headers:{"x-pro-key":key},cache:"no-store"});
        if(!response.ok)throw Error();
        const settings=await response.json();
        if(active){if(settings.slug)setPublishedSlug(settings.slug);const days=holdDays(settings.escrow_hold_days);setAssignedHold(days);setPolicyLoaded(true);setShop(previous=>({...previous,escrowHoldDays:days}));}
      }catch{if(active)setStatus("Could not refresh the admin-assigned hold period. Try again.");}
    }
    refreshPolicy();window.addEventListener("focus",refreshPolicy);
    return()=>{active=false;window.removeEventListener("focus",refreshPolicy);};
  },[shared,loaded]);
  const shopRef=useRef(shop);shopRef.current=shop;
  useEffect(()=>{
    if(!loaded||shared)return;
    const receive=()=>{try{const result=consumePending(shopRef.current,localStorage);if(result.added||result.shop.shopMode!==shopRef.current.shopMode){shopRef.current=result.shop;setShop(result.shop);setFilter(result.category||'All');setGenderFilter('all');setPreview(true);setAdding(false);if(result.added)setStatus('Product added to My Shop!');}}catch{setStatus('Could not save. Device storage may be full.');}};
    const message=(event:MessageEvent)=>{if(event.source!==window||event.origin!==location.origin||event.data?.type!=='SELLPOSTLY_PRODUCT_IMPORT')return;try{const item=normalizePending(event.data.product);localStorage.setItem(pendingShopKey,JSON.stringify(item));receive();}catch{setStatus('Could not save. Device storage may be full.');}};
    const storage=(event:StorageEvent)=>{if(event.key===pendingShopKey)receive();};
    window.addEventListener('message',message);window.addEventListener('storage',storage);window.addEventListener('focus',receive);receive();
    return()=>{window.removeEventListener('message',message);window.removeEventListener('storage',storage);window.removeEventListener('focus',receive);};
  },[loaded,shared]);
  async function share(){
    if(publicSlug||snapshot){setShareTarget({url:productShareUrl(publicSlug?storePath(publicSlug,shop.shopMode):'/shop?'+new URLSearchParams({s:snapshot!})),title:shop.name});return;}
    try{
      const key=localStorage.getItem("sellpostly-pro-key")||"";
      const response=await fetch("/api/shops",{method:"POST",headers:{"Content-Type":"application/json","x-pro-key":key},body:JSON.stringify(shop)});
      if(!response.ok)throw Error();
      const result=await response.json();
      setPublishedSlug(result.slug);setShareTarget({url:productShareUrl(storePath(result.slug,shop.shopMode)),title:shop.name});
    }catch{setStatus("Could not publish the shop. Check your Pro license and database setup.");}
  }
  async function shareMode(mode:'affiliate'|'personal',copyOnly=false){
    if(publishing)return;setPublishing(true);
    try{
      const headers={'Content-Type':'application/json','x-pro-key':localStorage.getItem('sellpostly-pro-key')||''};
      let selected=shop;
      if(mode!==shop.shopMode){const saved=localStorage.getItem(modeCatalogKey(mode));if(saved)selected=validateShop(JSON.parse(saved));else{const settings=await fetch('/api/shops',{headers,cache:'no-store'});if(!settings.ok)throw Error();const value=await settings.json();selected=value[mode+'_catalog']?validateShop(value[mode+'_catalog']):validateShop({...shop,shopMode:mode,products:[]});}}
      const response=await fetch('/api/shops',{method:'POST',headers,body:JSON.stringify(selected)});if(!response.ok)throw Error();
      const result=await response.json();setPublishedSlug(result.slug);const url=productShareUrl(storePath(result.slug,mode));
      if(copyOnly){await navigator.clipboard.writeText(url);setStatus('Copied!');}else setShareTarget({url,title:selected.name});
    }catch{setStatus('Could not publish the shop. Check your Pro license and database setup.');}finally{setPublishing(false);}
  }
  function createPost(product:Product){
    try{sessionStorage.setItem("sellpostly-post",JSON.stringify(product));location.href="/#formatter";}catch{setStatus("Could not save. Device storage may be full.");}
  }

  const lines=shop.products.filter(product=>cart[product.id]>0).map(product=>({product,quantity:cart[product.id]}));
  const count=lines.reduce((sum,line)=>sum+line.quantity,0);
  const total=cartTotal(lines);
  function changeCart(id:string,delta:number){setCart(previous=>({...previous,[id]:Math.max(0,Math.min(99,(previous[id]||0)+delta))}));}
  useEffect(()=>{setCartOpen(false);setCheckout(null);setCodLines(null);},[shop.shopMode]);
  const options=[...categories,...new Set(shop.products.map(p=>p.category).filter(c=>!categories.includes(c as typeof categories[number])))];
  const matches=shop.products.filter(p=>(filter==="All"||p.category===filter) && (genderFilter==="all"||p.gender===genderFilter) && (p.name+" "+p.category+" "+p.source).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  useEffect(()=>setVisible(24),[filter,genderFilter,search]);
  function label(value:string){return categories.includes(value as typeof categories[number])?t(value as Message):value;}
  return <main data-surface={shop.shopTheme} data-accent={shop.shopAccent||'emerald'} className="shop-surface storefront-layout mx-auto max-w-7xl px-5 py-12">
<header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
<div>{publicSlug&&verifiedStore&&<p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800"><span aria-hidden="true">✓</span>{t("Verified Store")}</p>}<div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black text-emerald-800">{shop.logo?<img src={shop.logo} alt={shop.name} className="max-h-full max-w-full object-contain"/>:(shop.name||"SP").trim().slice(0,2).toUpperCase()}</div><h1 className="text-4xl font-black">{shop.name==="My Shop"||!shop.name?t("My Shop"):shop.name}</h1><p className="mt-3 whitespace-pre-line text-slate-600">{shop.bio}</p></div>
{shared&&<div role="group" aria-label={t("Language")} className="flex gap-1 rounded-full border border-slate-300 bg-white p-1 text-slate-900">
{(["en","fr","ar"] as const).map(value=><button type="button" key={value} lang={value} aria-pressed={language===value} onClick={()=>setLanguage(value)} className={language===value?"rounded-full bg-emerald-700 px-3 py-2 text-sm font-semibold text-white":"rounded-full px-3 py-2 text-sm font-semibold"}>{value==="ar"?"العربية":value.toUpperCase()}</button>)}
</div>}</header>
{shared&&loaded&&<button type="button" className={button+" mb-5"} onClick={share}>{t("Share Store")}</button>}
{!loaded&&<p role="status">{t("Loading storefront…")}</p>}
    {(shared||preview)&&loaded&&shop.shopMode==='affiliate'&&<aside className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-label={t('Affiliate Disclosure')}><p className="mb-2 text-sm font-bold">{t('Affiliate Disclosure')}</p><p className="text-sm leading-relaxed">{(()=>{const value=shop.affiliateDisclosure||disclosurePresets[0].text;const preset=disclosurePresets.find(p=>[p.text,translations[p.text].fr,translations[p.text].ar].some(candidate=>candidate===value));return preset?t(preset.text):value;})()}</p></aside>}
    {(shared||preview)&&loaded&&<StorefrontHero shop={shop} verified={verifiedStore}/>}
    <label className="mb-4 block">{t("Search Products")}<input type="search" className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label>
    {!shared&&<div className="mb-6 flex flex-wrap gap-3">
      {!shared && <><button className={button} onClick={()=>setPreview(false)}>{t("Builder")}</button><button className={button} onClick={()=>{setPreview(true);setAdding(false);}}>{t("Storefront Preview")}</button></>}
      <button className={button} disabled={!loaded} onClick={share}>{t("Share Store")}</button>
    </div>}
    {!shared&&loaded&&<div className="mb-6 flex flex-wrap gap-3" aria-label={t('Preview Template')}>{(['affiliate','personal'] as const).map(mode=><button type="button" key={mode} aria-pressed={shop.shopMode===mode} className={shop.shopMode===mode?button:'rounded-lg border px-4 py-2'} onClick={()=>{try{setShop(switchCatalog(shop,mode,localStorage));setPreview(true);setAdding(false);setFilter('All');setGenderFilter('all');}catch{setStatus('Could not save. Device storage may be full.');}}}>{t(mode==='affiliate'?'Affiliate Deals Shop':'Personal Seller Shop')}</button>)}</div>}
    {!shared&&loaded&&<section className="mb-6 grid gap-4 md:grid-cols-2">{(['affiliate','personal'] as const).map(mode=><article key={mode} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">{t(mode==='affiliate'?'Affiliate Store Link':'Personal Store Link')}</h2><p className="my-3 text-sm text-slate-600">{t(mode==='affiliate'?'External deals only. No cart or escrow.':'Your products, cart and enabled checkout methods.')}</p><input aria-label={t(mode==='affiliate'?'Affiliate Store Link':'Personal Store Link')} readOnly dir="ltr" className={field} value={publishedSlug?productShareUrl(storePath(publishedSlug,mode)):t('Publish to create this link')}/><div className="mt-3 flex gap-3"><button disabled={publishing} type="button" className={button} onClick={()=>shareMode(mode,true)}>{t('Copy Link')}</button><button disabled={publishing} type="button" className="rounded-lg border px-4 py-2" onClick={()=>shareMode(mode)}>{t('Social Share')}</button></div></article>)}</section>}
    {!shared&&<p className="mb-4 text-sm text-slate-600">{t("Publish your latest changes to update your public storefront.")}</p>}
    {!preview&&!shared&&loaded && <section className="mb-8 grid gap-4 rounded-xl border bg-slate-50 p-5 sm:grid-cols-3">
      <fieldset className="sm:col-span-3"><legend className="mb-2 font-semibold">{t("Shop Type")}</legend><div className="flex flex-wrap gap-3">{(["affiliate","personal"] as const).map(mode=><button type="button" key={mode} aria-pressed={shop.shopMode===mode} className={shop.shopMode===mode?button:"rounded-lg border px-4 py-2"} onClick={()=>{try{setShop(switchCatalog(shop,mode,localStorage));setAdding(false);setEditing(null);setFilter("All");setGenderFilter("all");}catch{setStatus("Could not save. Device storage may be full.");}}}>{t(mode==="affiliate"?"Affiliate Storefront":"Personal Seller Store")}</button>)}</div><p className="mt-2 text-sm text-slate-600">{t("Each shop type has its own catalog. Switching types never moves products.")}</p></fieldset>
      {shop.shopMode==='affiliate'&&<fieldset className="sm:col-span-3"><legend className="mb-3 font-semibold">{t('Affiliate Disclosure')}</legend><div className="mb-3 flex flex-wrap gap-2">{disclosurePresets.map(preset=><button type="button" key={preset.label} className="rounded-full border border-emerald-700 px-4 py-2 text-sm font-semibold" onClick={()=>setShop({...shop,affiliateDisclosure:t(preset.text)})}>{t(preset.label)}</button>)}</div><label className="block">{t('Editable Affiliate Disclosure')}<textarea className={field} rows={4} maxLength={500} value={shop.affiliateDisclosure||''} placeholder={t(disclosurePresets[0].text)} onChange={e=>setShop({...shop,affiliateDisclosure:e.target.value})}/></label><button type="button" className={button+' mt-3'} disabled={publishing} onClick={()=>shareMode('affiliate')}>{t('Save Disclosure')}</button></fieldset>}
      <label>{t("Store Logo")}<input type="file" accept="image/png,image/jpeg,image/webp" className={field} onChange={event=>{
        const file=event.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");const scale=Math.min(1,256/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);setShop(previous=>({...previous,logo:canvas.toDataURL("image/png")}));};image.src=String(reader.result);};reader.readAsDataURL(file);
      }}/>{shop.logo&&<button type="button" className="mt-2 text-sm underline" onClick={()=>setShop({...shop,logo:""})}>{t("Remove Logo")}</button>}</label>
      {shop.shopMode==="personal"&&<><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold">{t("Admin-assigned escrow hold")}: {assignedHold} {t("days")}</p><p className="mt-2 text-sm">{t("Only the Admin can change this period. Changes apply to new orders; existing orders keep their original hold.")}</p>{!policyLoaded&&<p className="mt-2 text-xs">{t("Default hold shown until admin settings load.")}</p>}</div>
      <p className="text-sm">{t("Payments are verified and releases are recorded by the Admin. Transfers are handled separately.")}</p>
      {!escrowReady&&<p className="text-sm sm:col-span-3" role="status">{t("Escrow checkout is unavailable. The platform escrow wallet has not been configured.")}</p>}</>}
      {shop.shopMode==='personal'&&<fieldset className="rounded-xl border bg-white p-4 sm:col-span-3"><legend className="font-bold">{t('Personal Seller Payment Settings')}</legend><label className="block">{t('Seller USDC Wallet Address (Polygon)')}<input dir="ltr" className={field} maxLength={42} placeholder="0x..." value={shop.cryptoWallet||''} onChange={e=>setShop({...shop,cryptoWallet:e.target.value.trim()})}/></label><p className="mt-2 text-sm text-slate-600">{t('Payout destination only. Buyers pay the platform escrow wallet.')}</p><label className="mt-4 block">{t('Seller Email')}<input type="email" className={field} maxLength={254} value={shop.sellerEmail||''} onChange={e=>setShop({...shop,sellerEmail:e.target.value})}/></label><div className="my-4 flex flex-wrap gap-5"><label className="flex items-center gap-2"><input type="checkbox" checked={shop.codEnabled!==false} onChange={e=>setShop({...shop,codEnabled:e.target.checked})}/>{t('Enable Cash on Delivery')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={shop.escrowEnabled!==false} onChange={e=>setShop({...shop,escrowEnabled:e.target.checked})}/>{t('Enable USDC Escrow')}</label></div><button type="button" className={button} disabled={publishing} onClick={()=>shareMode('personal')}>{t('Save Payment Settings')}</button></fieldset>}
      <fieldset className="grid gap-4 rounded-xl border p-4 sm:col-span-3 sm:grid-cols-2"><legend className="font-bold">{t('Template Design')}</legend><label>{t('Hero Headline')}<input className={field} maxLength={140} value={shop.heroTitle||''} onChange={e=>setShop({...shop,heroTitle:e.target.value})}/></label><label>{t('Hero Subtitle')}<input className={field} maxLength={400} value={shop.heroSubtitle||''} onChange={e=>setShop({...shop,heroSubtitle:e.target.value})}/></label><label>{t('Hero Image URL')}<input type="url" className={field} value={shop.heroImage||''} onChange={e=>setShop({...shop,heroImage:e.target.value})}/></label><label>{t('Store Accent Palette')}<select className={field} value={shop.shopAccent||'emerald'} onChange={e=>setShop({...shop,shopAccent:e.target.value as typeof shopAccents[number]})}>{shopAccents.map((value,i)=><option key={value} value={value}>{t(shopAccentNames[i])}</option>)}</select></label><p className="text-sm text-slate-600 sm:col-span-2">{t('Design changes apply only to this storefront template.')}</p></fieldset>
      <label>{t("Shop Background Color")}<select className={field} value={shop.shopTheme} onChange={e=>setShop({...shop,shopTheme:e.target.value as Surface})}>{surfaces.map((surface,index)=><option key={surface} value={surface}>{t(surfaceNames[index])}</option>)}</select></label>
      <label>{t("Shop Name")}<input className={field} maxLength={100} value={shop.name} onChange={e=>setShop({...shop,name:e.target.value})}/></label>
      <label>{t("Bio")}<input className={field} maxLength={500} value={shop.bio} onChange={e=>setShop({...shop,bio:e.target.value})}/></label>
      <label>{t("WhatsApp Order Number")}<input className={field} dir="ltr" placeholder="+1 555 123 4567" value={shop.phone} onChange={e=>setShop({...shop,phone:e.target.value})}/></label>
      {!shop.phone.replace(/\D/g,"")&&<p className="text-sm sm:col-span-3">{t("Add your WhatsApp number in Shop Settings above to enable WhatsApp checkout.")}</p>}
<button className={button} onClick={()=>{setEditing(null);setPhoto("");setAdding(!adding);}}>{t("Add Product")}</button>
    </section>}
    {adding&&!preview&&!shared && <form key={editing?.id || "new"} id="shop-product-form" className="mb-8 grid gap-4 rounded-xl border p-5 sm:grid-cols-2" onSubmit={e=>{
      e.preventDefault();const data=new FormData(e.currentTarget);
      const get=(key:string)=>String(data.get(key)||"").trim();


      const product:Product={editorialCover:editorCover,identityOverride,stock:get('stock')===''?undefined:Math.min(1000000,Math.max(0,Math.trunc(Number(get('stock'))))),catalogMode:shop.shopMode,id:editing?.id || crypto.randomUUID(),name:get("name"),price:get("price"),compareAtPrice:get("compareAtPrice"),badge:get("badge") as DealBadge,category:get("category")||"Top Deals",gender:normalizeGender(get("gender")),image:shop.shopMode==='affiliate'?affiliateImage(photo||safeImage(get("image")),get("category"),identityOverride||get("name"),editorCover):photo||safeImage(get("image")),url:safeUrl(get("url")),source:get("source"),images:get("images").split(/\n/).filter(value=>value.trim()).map(value=>shop.shopMode==='affiliate'?affiliateImage(safeImage(value),get("category"),identityOverride||get("name")):safeImage(value)).filter(Boolean).slice(0,8),description:get("description").slice(0,4000)};
      if(shop.shopMode==='affiliate'&&(isAmazonCdnImage(get("image"))||get("images").split(/\n/).some(isAmazonCdnImage)))setStatus(amazonImageNotice);
      setShop({...shop,products:editing?shop.products.map(item=>item.id===editing.id?product:item):[...shop.products,product]});
      setEditing(null);
      setAdding(false);setPhoto("");
    }}>
      {(["Product Name","Price","Category","Image URL","Affiliate / Checkout URL"] as const).map((text,i)=><label key={text}>{t(text)}<input className={field} defaultValue={editing ? editing[["name","price","category","image","url"][i] as keyof Product] : ""} name={["name","price","category","image","url"][i]} type={i===4?"url":"text"} onChange={e=>{if(i===0)setDraftTitle(e.target.value);if(i===2)setDraftCategory(e.target.value);}} onBlur={event=>{if(i===3&&shop.shopMode==='affiliate'&&isAmazonCdnImage(event.target.value)){const form=event.target.form;event.target.value=affiliateImage(event.target.value,String(new FormData(form!).get('category')||'Other'),identityOverride||draftTitle,editorCover);setPhoto(event.target.value);setImageNotice(true);}else if(i===3){setPhoto(safeImage(event.target.value));setEditorCover(undefined);}}} required={i===0||(i===4&&shop.shopMode==="affiliate")} maxLength={i===0?120:2048} list={i===2?"shop-categories":undefined}/></label>)}
      {imageNotice&&shop.shopMode==='affiliate'&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm sm:col-span-2">{t(amazonImageNotice)}</p>}
      <datalist id="shop-categories">{categories.slice(1).map(c=><option key={c} value={c}>{label(c)}</option>)}</datalist>
      <label>{t("Gender / Audience")}<select className={field} name="gender" defaultValue={editing?.gender || "unisex"}><option value="unisex">{t("All / Unisex")}</option><option value="men">{t("Men")}</option><option value="women">{t("Women")}</option><option value="kids">{t("Kids")}</option></select></label>
      <label>{t('Stock (Optional)')}<input type="number" name="stock" className={field} min={0} max={1000000} defaultValue={editing?.stock??''}/></label>
      <label>{t("Compare-at Price")}<input className={field} name="compareAtPrice" maxLength={50} defaultValue={editing?.compareAtPrice||""}/></label>
      <label>{t("Deal Badge")}<select className={field} name="badge" defaultValue={editing?.badge||"none"}>{dealBadges.map(badge=><option key={badge} value={badge}>{t(badge==="none"?"None":badge==="hot"?"Hot":badge==="sale"?"Sale":badge==="limited"?"Limited":"New")}</option>)}</select></label>
      <label className="sm:col-span-2">{t("Product Description")}<textarea className={field} name="description" rows={3} maxLength={4000} defaultValue={editing?.description||""}/></label>
      <label className="sm:col-span-2">{t("Additional Product Photos")}<textarea className={field} name="images" rows={3} maxLength={16000} defaultValue={(editing?.images||[]).join("\n")} onBlur={e=>{if(shop.shopMode==='affiliate'&&e.target.value.split(/\n/).some(isAmazonCdnImage)){const category=String(new FormData(e.target.form!).get('category')||'Other');e.target.value=e.target.value.split(/\n/).map(value=>affiliateImage(value,category)).join('\n');setImageNotice(true);}}}/><span className="text-xs">{t("One image URL per line (up to 8).")}</span></label>
      <label>{t("Source Badge")}<select className={field} name="source" defaultValue={editing?.source || "Other"}>{["Amazon","AliExpress","Shopify","WhatsApp Direct","Other"].map(c=><option key={c} value={c}>{c==="Other"?t("Other"):c}</option>)}</select></label>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white focus-within:ring-2 focus-within:ring-emerald-300">{t(shop.shopMode==='affiliate'?'Upload Custom Photo':'Upload Product Photo')}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{
        const file=e.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const scale=Math.min(1,600/Math.max(img.width,img.height));c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d")!.drawImage(img,0,0,c.width,c.height);setPhoto(c.toDataURL("image/jpeg",0.7));setEditorCover(undefined);};img.src=String(reader.result);};reader.readAsDataURL(file);
      }}/></label>
      {shop.shopMode==='affiliate'&&<AffiliateImageEditor title={draftTitle} category={draftCategory} override={identityOverride} onOverride={setIdentityOverride} selected={editorCover} customImage={photo||editing?.image||''} onSelect={niche=>{setEditorCover(niche);const value=studioCover(niche||extractProductIdentity(identityOverride||draftTitle,draftCategory).visualNiche);setPhoto(value);const field=document.querySelector<HTMLInputElement>('#shop-product-form input[name="image"]');if(field)field.value=value;}}/>}
      <button className={button}>{t("Save Product")}</button>
    </form>}
    
    {!shared&&<p className="mb-4 text-sm text-slate-600">{t("Sample products are demonstrations. Replace their details and links before sharing.")}</p>}
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("Category")}>{options.map(c=><button className={filter===c?button:"rounded-lg border px-4 py-2"} key={c} onClick={()=>setFilter(c)} aria-pressed={filter===c}>{label(c)} ({c==="All"?shop.products.length:shop.products.filter(p=>p.category===c).length})</button>)}</div>
    <div role="group" aria-label={t("Gender / Audience")} className="mb-6 flex flex-wrap gap-2">
      {(["all","men","women","unisex","kids"] as const).map(value=><button type="button" key={value} aria-pressed={genderFilter===value} onClick={()=>setGenderFilter(value)} className={genderFilter===value?button:"rounded-lg border px-4 py-2"}>{t(value==="all"?"All":value==="men"?"Men":value==="women"?"Women":value==="kids"?"Kids":"Unisex")}</button>)}
    </div>
    {(shared||preview)?<><div id="store-collection" className="store-collection-heading"><h2>{t(shop.shopMode==='affiliate'?'The Curated Edit':'The Signature Collection')}</h2><span className="text-sm text-slate-600">{matches.length} {t('pieces to explore')}</span></div><StorefrontProducts shop={shop} products={matches.slice(0,visible)} slug={publicSlug} snapshot={snapshot} onAdd={(p,q)=>changeCart(p.id,q)} onPay={(p,q)=>setCheckout(productCheckout(p,q))} onCod={(p,q)=>setCodLines([{product:p,quantity:q}])}/></>:(<>    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.slice(0,visible).map(p=><article key={p.id} onClick={e=>{if(shop.shopMode==="personal"&&!(e.target as HTMLElement).closest("a,button,input,textarea,select"))location.href=productPath(p.id,publicSlug,snapshot);}} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className={(shop.shopMode==="personal"?"cursor-pointer ":"")+"product-image-frame h-52 w-full bg-slate-50 p-4 flex items-center justify-center overflow-hidden rounded-xl"}>{p.image&&<img src={p.image} alt={p.name} className={"max-h-full max-w-full w-auto h-auto object-contain "+(shop.shopTheme==="slate"?"":"mix-blend-multiply")} onError={e=>{e.currentTarget.style.display="none";}}/>}</div>
      <p className="mt-3 text-xs text-emerald-800">{p.source}</p><h2 className="text-xl font-bold">{shop.shopMode==="personal"?<a href={productPath(p.id,publicSlug,snapshot)} className="hover:underline">{p.id.startsWith("sample-")?t(p.name as Message):p.name}</a>:p.id.startsWith("sample-")?t(p.name as Message):p.name}</h2><p className="my-2 font-semibold">{p.price} {p.compareAtPrice&&<del className="ms-2 text-sm font-normal text-slate-600">{p.compareAtPrice}</del>}</p>{p.badge&&p.badge!=="none"&&<span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold">{t(p.badge==="hot"?"Hot":p.badge==="sale"?"Sale":p.badge==="limited"?"Limited":"New")}</span>}{p.gender!=="unisex"&&<span className="mb-2 inline-block rounded-full bg-slate-50 px-3 py-1 text-xs">{t(p.gender==="men"?"Men":p.gender==="kids"?"Kids":"Women")}</span>}
      {p.description&&<p dir="auto" className="my-3 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
      {shop.shopMode==="affiliate"&&shop.affiliateDisclosure&&<p className="my-2 text-xs text-slate-600">{shop.affiliateDisclosure}</p>}
      <div className="flex flex-wrap gap-2 text-sm">
        {shop.shopMode==="personal"&&<a className="rounded-lg border px-3 py-2" href={productPath(p.id,publicSlug,snapshot)}>{t("View Product")}</a>}
        {shop.shopMode==="personal"&&!shared&&<button type="button" className="rounded-lg border px-3 py-2" onClick={async()=>{try{const response=await fetch("/api/shops",{method:"POST",headers:{"Content-Type":"application/json","x-pro-key":localStorage.getItem("sellpostly-pro-key")||""},body:JSON.stringify(shop)});if(!response.ok)throw Error();const result=await response.json();setShareTarget({url:productShareUrl(productPath(p.id,result.slug)),title:p.name,product:true});}catch{setStatus("Publish your shop to create a shareable product link.");}}}>{t("Share Product")}</button>}
        {shop.shopMode==="personal"&&<button type="button" className={button} onClick={()=>changeCart(p.id,1)}>{t("Add to Cart")}</button>}
        {shop.shopMode==="personal"&&shop.escrowEnabled!==false&&<button type="button" className={button} onClick={()=>setCheckout({product:p,details:""})}>{t("Pay with USDC / USDT")}</button>}
        {shop.shopMode==="affiliate"&&p.url&&<a className={button} href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer sponsored">{t("View Deal / Buy Now")}</a>}
        {shop.shopMode==="personal"&&shop.codEnabled!==false&&<button type="button" className="rounded-lg border px-3 py-2" onClick={()=>setCodLines([{product:p,quantity:1}])}>{t("Cash on Delivery (COD)")}</button>}
        {shop.shopMode==="personal"&&shop.phone.replace(/\D/g,"")&&<a className="rounded-lg border px-3 py-2" href={"https://wa.me/"+shop.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(t("I would like to order")+" "+p.name+" "+p.price)} target="_blank" rel="noopener noreferrer">{t("Order via WhatsApp")}</a>}
        {!shared&&<button className="rounded-lg border px-3 py-2" onClick={()=>createPost(p)}>{t("Create Social Post")}</button>}
        {!shared&&!preview&&<button className="rounded-lg border px-3 py-2" onClick={()=>{setEditing(p);setPhoto("");setImageNotice(isAmazonCdnImage(p.image)||p.images?.some(isAmazonCdnImage)||false);setAdding(true);setTimeout(()=>document.getElementById("shop-product-form")?.scrollIntoView({behavior:"smooth"}),0);}}>{t("Edit Product")}</button>}
        {!shared&&!preview&&<button className="rounded-lg border px-3 py-2" onClick={()=>setShop({...shop,products:shop.products.filter(item=>item.id!==p.id)})}>{t("Remove")}</button>}
      </div>
    </article>)}</div>
</>)}
    {matches.length===0&&loaded&&<p>{t("No products found.")}</p>}
    {matches.length>visible&&<button type="button" className={button+" mt-6"} onClick={()=>setVisible(count=>count+24)}>{t("Load More")}</button>}
    {shop.shopMode==="personal"&&<button type="button" onClick={()=>setCartOpen(true)} className="fixed bottom-5 end-5 z-30 rounded-full bg-emerald-700 px-5 py-3 font-bold text-white shadow-lg">{t("Shopping Bag")} ({count}) · {total?(total.currency==="USD"?"$":"")+total.amount+(total.currency!=="USD"?" "+total.currency:""):"—"}</button>}
    {shop.shopMode==="personal"&&cartOpen&&<CartDrawer isSharedBuyerView={shared} lines={lines} shop={shop} onCod={()=>{setCartOpen(false);setCodLines(lines);}} change={changeCart} onClose={()=>setCartOpen(false)} onPay={(product,details,items)=>setCheckout({product,details,items})}/>}
    {shop.shopMode==="personal"&&shop.codEnabled!==false&&codLines&&<CodCheckout storeSlug={publicSlug} shop={shop} lines={codLines} onClose={()=>setCodLines(null)}/>}
    {shareTarget&&<ShareModal {...shareTarget} onClose={()=>setShareTarget(null)}/>}
    {shop.shopMode==="personal"&&shop.escrowEnabled!==false&&checkout&&<CryptoCheckout storeSlug={publicSlug} orderItems={checkout.items||[{id:checkout.product.id,quantity:1}]} product={checkout.product} orderDetails={checkout.details} shop={shop} onClose={()=>setCheckout(null)}/>}
    <p role="status" className="my-4 text-emerald-800">{status&&t(status)}</p>
{shared&&<BuyerStoreFooter storeSlug={publicSlug}/>}
  </main>;
}



