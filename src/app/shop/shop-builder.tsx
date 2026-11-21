"use client";
import DeleteShopDialog from './delete-shop-dialog';
import {removeNicheShopDraft} from './delete-shop-storage';
import {studioImportKey} from '../../lib/studio-handoff';
import CopyAssistant from '../generation/copy-assistant';
import ProductImageGenerator from '../generation/product-image-generator';
import type {CopyResult} from '../../lib/generation-data';
import StorePolicy from './store-policy';
import {refundPolicies,refundPolicyLabels} from './store-policy-data';
import MainStoreLink from './main-store-link';
import MultiShopSwitcher from './multi-shop-switcher';
import {shopListKey,activeShopKey,shopSelection,readShopList,persistShop,switchShop,shopDraftKey,shopHeaders,targetPendingShop} from './multi-shop-data';
import {cardShareUrl} from '../../lib/storefront-seo';
import {defaultStock,isLocalStock,resolvePhotos,selectStock,type StockPhoto} from './stock-photos';
import {unbrandedQuery} from './unbranded-query';
import {promoVideo} from './promo-video';
import {savePaymentSettings} from '../../lib/save-payment-settings';
import StorefrontSeoLocale from './storefront-seo-locale';
import PaymentSettingsEditor from './payment-settings';
import AffiliateImageEditor from './affiliate-image-editor';
import {extractProductIdentity,studioCover,isStudioCover,type VisualNiche} from './product-identity';
import {disclosurePresets,amazonImageNotice,amazonAffiliateProduct,isAmazonCdnImage,affiliateImage,studioCategoryImage} from './affiliate-compliance';
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

import CryptoCheckout from "./peer-checkout";
import { Fragment, useEffect, useState, useRef } from "react";
import { surfaces, surfaceNames, type Surface } from "../theme-picker";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import { normalizeGender, type Gender, categories, decodeShop, safeImage, safeUrl, shopKey, validateShop, dealBadges, type DealBadge, type Product, type Shop } from "./shop-data";

const field="mt-1 block w-full rounded-lg border border-slate-300 p-2";
const button="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white";
export default function ShopBuilder({isSharedBuyerView=false,initialShop,publicSlug,verifiedStore=false,workspace='products'}:{workspace?:'products'|'settings';isSharedBuyerView?:boolean;initialShop?:Shop;publicSlug?:string;verifiedStore?:boolean}){
  const {t,language,setLanguage}=useLanguage();
  const [shop,setShop]=useState<Shop>(initialShop?validateShop(initialShop):{name:"",bio:"",phone:"",shopMode:"affiliate",shopTheme:"white",products:[]});
  const [shops,setShops]=useState<Shop[]>([]),[tier,setTier]=useState<'free'|'pro'>('free');
  const [publishedSlug,setPublishedSlug]=useState(publicSlug||''),[publishing,setPublishing]=useState(false);
  const [assignedHold,setAssignedHold]=useState(holdDays(initialShop?.escrowHoldDays));
  const [policyLoaded,setPolicyLoaded]=useState(!!initialShop);
  const [loaded,setLoaded]=useState(!!initialShop),[shared,setShared]=useState(isSharedBuyerView),[preview,setPreview]=useState(isSharedBuyerView),[adding,setAdding]=useState(false);
  const [checkout,setCheckout]=useState<{product:Product;details:string;items?:{id:string;quantity:number}[]} | null>(null);

  const [cartOpen,setCartOpen]=useState(false);
  const [shareTarget,setShareTarget]=useState<{url:string;title:string;product?:boolean}|null>(null),[codLines,setCodLines]=useState<{product:Product;quantity:number}[]|null>(null);
  const [imageNotice,setImageNotice]=useState(false);
  const [paymentMessage,setPaymentMessage]=useState<Message|''>('');
  const [draftUrl,setDraftUrl]=useState(''),[draftAmazonBlocked,setDraftAmazonBlocked]=useState(false);
  const [draftAiImage,setDraftAiImage]=useState(false),[draftAiPrompt,setDraftAiPrompt]=useState('');
  const [draftDigital,setDraftDigital]=useState(false);
  const [draftStock,setDraftStock]=useState<StockPhoto|undefined>();const [draftGender,setDraftGender]=useState<Gender>('unisex');
  const [draftTitle,setDraftTitle]=useState(''),[draftCategory,setDraftCategory]=useState(''),[identityOverride,setIdentityOverride]=useState(''),[editorCover,setEditorCover]=useState<VisualNiche|undefined>();
  const [editing,setEditing]=useState<Product | null>(null);
  useEffect(()=>{setDraftAiImage(editing?.aiGeneratedImage||false);setDraftAiPrompt(editing?.aiImagePrompt||'');setDraftDigital(editing?.isDigital??editing?.category==='Digital Product');setDraftTitle(editing?.name||'');setDraftUrl(editing?.url||'');setDraftAmazonBlocked(editing?.amazonImageBlocked||false);setDraftCategory(editing?.category||'');setIdentityOverride(editing?.identityOverride||'');setEditorCover(editing?.editorialCover);setDraftStock(editing?.stockPhoto);setDraftGender(editing?.gender||'unisex');},[editing,adding]);
  const [genderFilter,setGenderFilter]=useState<Gender | "all">("all");
  const [search,setSearch]=useState("");
  const [visible,setVisible]=useState(24);
  const snapshot=typeof window==='undefined'?undefined:new URLSearchParams(location.search).get('s')||undefined;
  const [cart,setCart]=useShopCart(shop,publicSlug,snapshot,loaded&&shop.shopMode==='personal');
  const [filter,setFilter]=useState("All"),[photo,setPhotoRaw]=useState(""),[status,setStatus]=useState<Message|"">("");
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
            const response=await fetch('/api/shops',{headers:shopHeaders(localStorage),cache:'no-store'});
            if(response.ok){const settings=await response.json();setTier(settings.tier==='pro'?'pro':'free');
 const server:Shop[]=Array.isArray(settings.shops)?settings.shops.map(validateShop):[];
 for(const mode of ['affiliate','personal'] as const){if(!server.some(s=>s.storeMode!=='niche'&&s.shopMode===mode)){const catalog=settings[mode+'_catalog'];const draft=localStorage.getItem(modeCatalogKey(mode));server.push(validateShop(catalog|| (draft?JSON.parse(draft):{name:initial.name,bio:'',products:[],shopMode:mode})));}}
 const list=server.map(target=>{const draft=localStorage.getItem(shopDraftKey(target));return draft?validateShop({...JSON.parse(draft),shopId:target.shopId,customSlug:target.customSlug,storeMode:target.storeMode,shopMode:target.shopMode,escrowHoldDays:target.escrowHoldDays,mainStoreSlug:target.mainStoreSlug}):target;});
 localStorage.setItem(shopListKey,JSON.stringify(list));setShops(list);
 const active=params.get('mode')?list.find(s=>s.storeMode!=='niche'&&s.shopMode===params.get('mode')):list.find(s=>shopSelection(s)===(localStorage.getItem(activeShopKey)||shopSelection(initial)));
 if(active)initial=active;else if(initial.storeMode==='niche'||!saved)initial=list.find(s=>s.storeMode!=='niche'&&s.shopMode===initial.shopMode)||list[0]||initial;
 if(initial.customSlug||settings.slug)setPublishedSlug(initial.customSlug||settings.slug);
 }
          }catch{}
          if(params.get("mode")==="personal"&&initial.shopMode!=="personal")initial=switchCatalog(initial,"personal",localStorage);
          if(workspace==='products'&&params.get("addTitle")){
            const destination=params.get("addDestination");initial=targetPendingShop(initial,params.get('addShopId')||undefined,destination==='affiliate'||destination==='personal'?destination:undefined,localStorage);if((destination==="affiliate"||destination==="personal")&&initial.shopMode!==destination)initial=switchCatalog(initial,destination,localStorage);
            setPreview(true);
            const product:Product={id:crypto.randomUUID(),name:params.get("addTitle")!.slice(0,120),price:(params.get("addPrice")||"").slice(0,50),description:(params.get("addDescription")||"").slice(0,4000),image:safeImage(params.get("addImage")||""),url:safeUrl(params.get("addUrl")||""),gender:normalizeGender(params.get("addGender")),category:initial.storeMode==='niche'?initial.nicheName||'Other':(params.get("addCategory")||"Top Deals").slice(0,80),source:"Other"};
            initial.products.push(product);
            setFilter(initial.storeMode==='niche'?'All':product.category);
            try {localStorage.setItem(shopKey,JSON.stringify(initial));}catch{setStatus("Could not save. Device storage may be full.");}
            history.replaceState(null,"",location.pathname);
          }

          if(workspace==='products')try {
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
  useEffect(()=>{if(loaded&&!shared)try{localStorage.setItem(shopKey,JSON.stringify(shop));persistShop(shop,localStorage);setShops(readShopList(localStorage));}catch{setStatus("Could not save. Device storage may be full.");}},[shop,loaded,shared]);
  useEffect(()=>{
    if(shared||!loaded)return;
    let active=true;
    async function refreshPolicy(){
      try{
        const key=localStorage.getItem("sellpostly-pro-key")||"";
        const response=await fetch("/api/shops",{headers:shopHeaders(localStorage),cache:"no-store"});
        if(!response.ok)throw Error();
        const settings=await response.json();
        if(active){setTier(settings.tier==='pro'?'pro':'free');const current=shopRef.current;const assigned=(settings.shops||[]).find((s:Shop)=>shopSelection(s)===shopSelection(current));if(assigned?.customSlug||current.customSlug||settings.slug)setPublishedSlug(assigned?.customSlug||current.customSlug||settings.slug);const days=holdDays(assigned?.escrowHoldDays??settings.escrow_hold_days);setAssignedHold(days);setPolicyLoaded(true);setShop(previous=>({...previous,escrowHoldDays:days,mainStoreSlug:assigned?.mainStoreSlug}));}
      }catch{if(active)setStatus("Could not refresh the admin-assigned hold period. Try again.");}
    }
    refreshPolicy();window.addEventListener("focus",refreshPolicy);
    return()=>{active=false;window.removeEventListener("focus",refreshPolicy);};
  },[shared,loaded,shop.shopId,shop.shopMode]);
  const shopRef=useRef(shop);shopRef.current=shop;
  useEffect(()=>{
    if(!loaded||shared||workspace!=='products')return;
    const receive=()=>{try{const result=consumePending(shopRef.current,localStorage);if(result.added||shopSelection(result.shop)!==shopSelection(shopRef.current)){shopRef.current=result.shop;setShop(result.shop);setPublishedSlug(result.shop.customSlug||'');setFilter(result.category||'All');setGenderFilter('all');setPreview(true);setAdding(false);if(result.added)setStatus('Product added to My Shop!');}}catch{setStatus('Could not save. Device storage may be full.');}};
    const message=(event:MessageEvent)=>{if(event.source!==window||event.origin!==location.origin||event.data?.type!=='SELLPOSTLY_PRODUCT_IMPORT')return;try{const item=normalizePending(event.data.product);localStorage.setItem(pendingShopKey,JSON.stringify(item));receive();}catch{setStatus('Could not save. Device storage may be full.');}};
    const storage=(event:StorageEvent)=>{if(event.key===pendingShopKey)receive();};
    window.addEventListener('message',message);window.addEventListener('storage',storage);window.addEventListener('focus',receive);receive();
    return()=>{window.removeEventListener('message',message);window.removeEventListener('storage',storage);window.removeEventListener('focus',receive);};
  },[loaded,shared]);
  const unresolved=loaded&&!shared&&shop.shopMode==='affiliate'?shop.products.filter(p=>amazonAffiliateProduct(p)&&p.stockPhoto&&p.photoResolvedFor!==unbrandedQuery(p.identityOverride||p.name,p.category,p.gender)).map(p=>[p.id,p.image,p.name,p.category,p.gender].join('|')).join('~'):'';
  useEffect(()=>{
    if(!unresolved)return;const controller=new AbortController();
    const products=shopRef.current.products.filter(p=>p.stockPhoto&&p.photoResolvedFor!==unbrandedQuery(p.identityOverride||p.name,p.category,p.gender));
    async function assign(){
      // Limit concurrent requests and ignore stale responses after a custom upload or catalog change.
      for(const p of products){if(controller.signal.aborted)return;const query=unbrandedQuery(p.identityOverride||p.name,p.category,p.gender);
        try{const choices=await resolvePhotos(query,controller.signal);let selected=choices[0]||defaultStock(query);try{await selectStock(selected,query);}catch{selected=defaultStock(query);}
          if(controller.signal.aborted)return;
          setShop(current=>current.shopMode!=='affiliate'?current:{...current,products:current.products.map(item=>item.id===p.id&&amazonAffiliateProduct(item)&&item.image===p.image&&item.name===p.name&&unbrandedQuery(item.identityOverride||item.name,item.category,item.gender)===query?{...item,image:selected.url,stockPhoto:selected,photoResolvedFor:query}:item)});
        }catch{if(controller.signal.aborted)return;}
      }
    }void assign();return()=>controller.abort();
  },[unresolved]);
  async function share(product?:Product){
    if(publicSlug||snapshot){setShareTarget({url:product?cardShareUrl(shop.shopMode,product.id,publicSlug,snapshot):productShareUrl(publicSlug?storePath(publicSlug,shop.shopMode):'/shop?'+new URLSearchParams({s:snapshot!})),title:product?.name||shop.name,product:!!product});return;}
    try{
      const key=localStorage.getItem("sellpostly-pro-key")||"";
      const response=await fetch("/api/shops",{method:"POST",headers:{"Content-Type":"application/json",...shopHeaders(localStorage)},body:JSON.stringify(shop)});
      if(!response.ok)throw Error();
      const result=await response.json();
      setPublishedSlug(result.slug);setShareTarget({url:product?cardShareUrl(shop.shopMode,product.id,result.slug):productShareUrl(storePath(result.slug,shop.shopMode)),title:product?.name||shop.name,product:!!product});
    }catch{setStatus("Could not publish the shop. Check your Pro license and database setup.");}
  }
  async function savePayments(){
    if(publishing)return;setPublishing(true);setPaymentMessage('');
    const snapshot=shopRef.current;
    try{const result=await savePaymentSettings(snapshot,localStorage);setPublishedSlug(result.slug);
      if(shopRef.current===snapshot){setShop(result.shop);setPaymentMessage(result.localSaved?'Payment settings saved.':'Payment settings saved online. Local storage is full.');}
      else setPaymentMessage('Payment settings saved. New edits remain unsaved.');
    }catch(e){setPaymentMessage(e instanceof Error&&e.message==='STORE_POLICY_REQUIRED'?'Select a refund policy and enter a delivery timeframe before saving.':'Could not save payment settings. Check your license and connection.');}finally{setPublishing(false);}
  }
  async function saveStoreSettings(){
    if(publishing)return;setPublishing(true);setStatus('');
    try{const current=shopRef.current;const response=await fetch('/api/shops',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify(current)});if(!response.ok)throw Error();const result=await response.json();let slug=result.slug;if(current.customSlug&&current.customSlug!==slug){const renamed=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify({action:'rename',shopId:current.shopId,slug:current.customSlug,currentSlug:slug})});if(!renamed.ok)throw Error();slug=(await renamed.json()).slug;}setPublishedSlug(slug);setShop(value=>({...value,customSlug:slug}));setStatus(shopRef.current===current?'Store settings saved.':'Store settings saved. New edits remain unsaved.');}
    catch{setStatus('Could not save store settings. Try again.');}finally{setPublishing(false);}
  }
  async function shareMode(mode:'affiliate'|'personal',copyOnly=false){
    if(publishing)return;setPublishing(true);
    try{
      const headers={'Content-Type':'application/json',...shopHeaders(localStorage)};
      let selected=shop;
      if(mode!==shop.shopMode){const saved=localStorage.getItem(modeCatalogKey(mode));if(saved)selected=validateShop(JSON.parse(saved));else{const settings=await fetch('/api/shops',{headers,cache:'no-store'});if(!settings.ok)throw Error();const value=await settings.json();selected=value[mode+'_catalog']?validateShop(value[mode+'_catalog']):validateShop({...shop,shopMode:mode,products:[]});}}
      const response=await fetch('/api/shops',{method:'POST',headers,body:JSON.stringify(selected)});if(!response.ok)throw Error();
      const result=await response.json();setPublishedSlug(result.slug);const url=productShareUrl(storePath(result.slug,mode));
      if(copyOnly){await navigator.clipboard.writeText(url);setStatus('Copied!');}else setShareTarget({url,title:selected.name});
    }catch{setStatus('Could not publish the shop. Check your Pro license and database setup.');}finally{setPublishing(false);}
  }
  function primaryShop(mode:'affiliate'|'personal'){return readShopList(localStorage).find(s=>s.storeMode!=='niche'&&s.shopMode===mode)||validateShop({name:'',bio:'',shopMode:mode,products:[]});}
  function activateShop(target:Shop){try{const next=switchShop(shopRef.current,target,localStorage);shopRef.current=next;setShop(next);setPublishedSlug(next.customSlug||'');setAssignedHold(holdDays(next.escrowHoldDays));setFilter('All');setGenderFilter('all');setSearch('');setAdding(false);setEditing(null);setCartOpen(false);setCheckout(null);setCodLines(null);setPaymentMessage('');setStatus('');}catch{setStatus('Could not save. Device storage may be full.');}}
  async function deleteActiveNiche(){const target=shopRef.current;if(target.storeMode!=='niche'||target.isPrimary!==false||!target.shopId)throw Error('PRIMARY_SHOP_PROTECTED');setPublishing(true);try{const response=await fetch('/api/shops?id='+encodeURIComponent(target.shopId),{method:'DELETE',headers:shopHeaders(localStorage)});if(!response.ok)throw Error('DELETE_FAILED');try{const result=removeNicheShopDraft(target,localStorage);shopRef.current=result.shop;setShop(result.shop);setShops(result.shops);setPublishedSlug(result.shop.customSlug||'');setAssignedHold(holdDays(result.shop.escrowHoldDays));setAdding(false);setEditing(null);setCartOpen(false);setCheckout(null);setCodLines(null);setPaymentMessage('');setStatus('Niche shop deleted.');}catch{location.replace('/settings');}}finally{setPublishing(false);}}
  async function createNiche(value:Record<string,string>){const r=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify({action:'createNiche',shop:value})});const result=await r.json();if(!r.ok)throw Error(result.error);const next=validateShop(result.shop);const list=[...readShopList(localStorage),next];localStorage.setItem(shopListKey,JSON.stringify(list));setShops(list);activateShop(next);setPreview(false);}
  function productCopyInput(){const form=document.getElementById('shop-product-form') as HTMLFormElement|null;const data=form?new FormData(form):null;return {title:String(data?.get('name')||draftTitle),description:String(data?.get('description')||''),category:shop.nicheName||draftCategory,destination:shop.shopMode};}
  function applyProductCopy(copy:CopyResult){const form=document.getElementById('shop-product-form') as HTMLFormElement|null;if(!form)return;for(const [key,value] of Object.entries({description:copy.description,keyHighlights:copy.highlights.join('\n'),promoCaption:copy.caption})){const field=form.elements.namedItem(key) as HTMLTextAreaElement|null;if(field)field.value=value;}}
  function editInStudio(product:Product){try{localStorage.setItem(studioImportKey,JSON.stringify(normalizePending({...product,title:product.name,destination:shop.shopMode,targetShopId:shop.shopId})));location.href='/studio';}catch{setStatus('Could not save. Device storage may be full.');}}
  function createPost(product:Product){
    try{sessionStorage.setItem("sellpostly-post",JSON.stringify(product));location.href="/#formatter";}catch{setStatus("Could not save. Device storage may be full.");}
  }

  const lines=shop.products.filter(product=>cart[product.id]>0).map(product=>({product,quantity:cart[product.id]}));
  const count=lines.reduce((sum,line)=>sum+line.quantity,0);
  const total=cartTotal(lines);
  function changeCart(id:string,delta:number){setCart(previous=>({...previous,[id]:Math.max(0,Math.min(99,(previous[id]||0)+delta))}));}
  useEffect(()=>{setCartOpen(false);setCheckout(null);setCodLines(null);},[shop.shopMode]);
  const options=[...categories,...new Set(shop.products.map(p=>p.category).filter(c=>!categories.includes(c as typeof categories[number])))];
  const matches=shop.products.filter(p=>(shop.storeMode==='niche'||filter==="All"||p.category===filter) && (genderFilter==="all"||p.gender===genderFilter) && (p.name+" "+p.category+" "+p.source).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  useEffect(()=>setVisible(24),[filter,genderFilter,search]);
  function setPhoto(value:string){setDraftAiImage(false);setPhotoRaw(value);}
  function label(value:string){return categories.includes(value as typeof categories[number])?t(value as Message):value;}
  return <main data-surface={shop.shopTheme} data-accent={shop.shopAccent||'emerald'} className="shop-surface storefront-layout mx-auto max-w-7xl px-5 py-12">{shared&&publicSlug&&loaded&&<StorefrontSeoLocale shop={shop} slug={publicSlug}/>}
<header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
<div>{publicSlug&&verifiedStore&&<p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800"><span aria-hidden="true">✓</span>{t("Verified Store")}</p>}<div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black text-emerald-800">{shop.logo?<img src={shop.logo} alt={shop.name} className="max-h-full max-w-full object-contain"/>:(shop.name||"SP").trim().slice(0,2).toUpperCase()}</div><h1 className="text-4xl font-black">{workspace==='settings'?t('Seller Settings'):shop.name==="My Shop"||!shop.name?t("My Shop"):shop.name}</h1><p className="mt-3 whitespace-pre-line text-slate-600">{shop.bio}</p></div>
{shared&&<div role="group" aria-label={t("Language")} className="flex gap-1 rounded-full border border-slate-300 bg-white p-1 text-slate-900">
{(["en","fr","ar"] as const).map(value=><button type="button" key={value} lang={value} aria-pressed={language===value} onClick={()=>setLanguage(value)} className={language===value?"rounded-full bg-emerald-700 px-3 py-2 text-sm font-semibold text-white":"rounded-full px-3 py-2 text-sm font-semibold"}>{value==="ar"?"العربية":value.toUpperCase()}</button>)}
</div>}</header>
{shared&&loaded&&<button type="button" className={button+" mb-5"} onClick={()=>void share()}>{t("Share Store")}</button>}
{!loaded&&<p role="status">{t("Loading storefront…")}</p>}
    {(shared||preview)&&loaded&&shop.shopMode==='affiliate'&&<aside className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-label={t('Affiliate Disclosure')}><p className="mb-2 text-sm font-bold">{t('Affiliate Disclosure')}</p><p className="text-sm leading-relaxed">{(()=>{const value=shop.affiliateDisclosure||disclosurePresets[0].text;const preset=disclosurePresets.find(p=>[p.text,translations[p.text].fr,translations[p.text].ar].some(candidate=>candidate===value));return preset?t(preset.text):value;})()}</p></aside>}
    {(shared||preview)&&loaded&&<><StorefrontHero shop={shop} verified={verifiedStore}/><MainStoreLink shop={shop}/><StorePolicy shop={shop}/></>}
    {workspace==='products'&&<label className="mb-4 block">{t("Search Products")}<input type="search" className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label>}
    {!shared&&<nav className="mb-6 flex flex-wrap gap-3 font-semibold" aria-label={t('Seller Workspace')}><a className="rounded-lg border px-4 py-2" href="/shop">{t('Products & Preview')}</a><a className="rounded-lg border px-4 py-2" href="/settings">{t('Store & Payment Settings →')}</a><a className="rounded-lg border px-4 py-2" href="/studio">{t('Creator Studio')}</a></nav>}{!shared&&workspace==='settings'&&<section className="mb-6 rounded-xl border bg-white p-5"><h2 className="text-2xl font-bold">{t('Seller Settings')}</h2><p className="mt-3">{t(tier==='pro'?'Pro Plan':'Free Plan')}</p><a className="mt-3 inline-block underline" href="/shop?upgrade=pro">{t('Activate Pro License')}</a></section>}
    {!shared&&workspace==='products'&&<div className="mb-6 flex flex-wrap gap-3">
      {!shared && <><button aria-pressed={!preview} className={button} onClick={()=>setPreview(false)}>{t("Builder")}</button><button aria-pressed={preview} className={button} onClick={()=>{setPreview(true);setAdding(false);}}>{t("Storefront Preview")}</button></>}
      <button className={button} disabled={!loaded} onClick={()=>void share()}>{t("Share Store")}</button>
    </div>}
    {!shared&&loaded&&<MultiShopSwitcher shops={shops} active={shop} tier={tier} onSelect={activateShop} onCreate={createNiche}/> }
    {!shared&&workspace==='products'&&loaded&&shop.storeMode!=='niche'&&<div className="mb-6 flex flex-wrap gap-3" aria-label={t('Preview Template')}>{(['affiliate','personal'] as const).map(mode=><button type="button" key={mode} aria-pressed={shop.shopMode===mode} className={shop.shopMode===mode?button:'rounded-lg border px-4 py-2'} onClick={()=>{try{activateShop(primaryShop(mode));setPreview(true);setAdding(false);setFilter('All');setGenderFilter('all');}catch{setStatus('Could not save. Device storage may be full.');}}}>{t(mode==='affiliate'?'Affiliate Deals Shop':'Personal Seller Shop')}</button>)}</div>}
    {!shared&&workspace==='products'&&loaded&&shop.storeMode!=='niche'&&<section className="mb-6 grid gap-4 md:grid-cols-2">{(['affiliate','personal'] as const).map(mode=><article key={mode} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">{t(mode==='affiliate'?'Affiliate Store Link':'Personal Store Link')}</h2><p className="my-3 text-sm text-slate-600">{t(mode==='affiliate'?'External deals only. No cart or escrow.':'Your products, cart and enabled checkout methods.')}</p><input aria-label={t(mode==='affiliate'?'Affiliate Store Link':'Personal Store Link')} readOnly dir="ltr" className={field} value={publishedSlug?productShareUrl(storePath(publishedSlug,mode)):t('Publish to create this link')}/><div className="mt-3 flex gap-3"><button disabled={publishing} type="button" className={button} onClick={()=>shareMode(mode,true)}>{t('Copy Link')}</button><button disabled={publishing} type="button" className="rounded-lg border px-4 py-2" onClick={()=>shareMode(mode)}>{t('Social Share')}</button></div></article>)}</section>}
    {!shared&&workspace==='products'&&loaded&&shop.storeMode==='niche'&&<section className="mb-6 rounded-2xl border bg-white p-5"><h2 className="font-bold">{shop.name}</h2><input aria-label={t('Copy Link')} readOnly dir="ltr" className={field} value={shop.customSlug?productShareUrl(storePath(shop.customSlug,shop.shopMode)):''}/><button type="button" className={button+" mt-3"} onClick={()=>void share()}>{t('Social Share')}</button></section>}
    {!shared&&workspace==='products'&&<p className="mb-4 text-sm text-slate-600">{t("Publish your latest changes to update your public storefront.")}</p>}
    {workspace==='settings'&&!shared&&loaded && <section className="mb-8 grid gap-4 rounded-xl border bg-slate-50 p-5 sm:grid-cols-3">
      <fieldset disabled={shop.storeMode==='niche'} className="sm:col-span-3"><legend className="mb-2 font-semibold">{t("Shop Type")}</legend><div className="flex flex-wrap gap-3">{(["affiliate","personal"] as const).map(mode=><button type="button" key={mode} aria-pressed={shop.shopMode===mode} className={shop.shopMode===mode?button:"rounded-lg border px-4 py-2"} onClick={()=>{try{setShop(switchCatalog(shop,mode,localStorage));setAdding(false);setEditing(null);setFilter("All");setGenderFilter("all");}catch{setStatus("Could not save. Device storage may be full.");}}}>{t(mode==="affiliate"?"Affiliate Storefront":"Personal Seller Store")}</button>)}</div><p className="mt-2 text-sm text-slate-600">{t("Each shop type has its own catalog. Switching types never moves products.")}</p></fieldset>
      {shop.shopMode==='affiliate'&&<fieldset className="sm:col-span-3"><legend className="mb-3 font-semibold">{t('Affiliate Disclosure')}</legend><div className="mb-3 flex flex-wrap gap-2">{disclosurePresets.map(preset=><button type="button" key={preset.label} className="rounded-full border border-emerald-700 px-4 py-2 text-sm font-semibold" onClick={()=>setShop({...shop,affiliateDisclosure:t(preset.text)})}>{t(preset.label)}</button>)}</div><label className="block">{t('Editable Affiliate Disclosure')}<textarea className={field} rows={4} maxLength={500} value={shop.affiliateDisclosure||''} placeholder={t(disclosurePresets[0].text)} onChange={e=>setShop({...shop,affiliateDisclosure:e.target.value})}/></label><button type="button" className={button+' mt-3'} disabled={publishing} onClick={()=>shareMode('affiliate')}>{t('Save Disclosure')}</button></fieldset>}
      <label>{t("Store Logo")}<input type="file" accept="image/png,image/jpeg,image/webp" className={field} onChange={event=>{
        const file=event.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");const scale=Math.min(1,256/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);setShop(previous=>({...previous,logo:canvas.toDataURL("image/png")}));};image.src=String(reader.result);};reader.readAsDataURL(file);
      }}/>{shop.logo&&<button type="button" className="mt-2 text-sm underline" onClick={()=>setShop({...shop,logo:""})}>{t("Remove Logo")}</button>}</label>
      {shop.shopMode==="personal"&&<><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold">{t("Admin-assigned escrow hold")}: {assignedHold} {t("days")}</p><p className="mt-2 text-sm">{t("Only the Admin can change this period. Changes apply to new orders; existing orders keep their original hold.")}</p>{!policyLoaded&&<p className="mt-2 text-xs">{t("Default hold shown until admin settings load.")}</p>}</div>
      <p className="text-sm">{t("Payments are verified and releases are recorded by the Admin. Transfers are handled separately.")}</p>
      {!escrowReady&&<p className="text-sm sm:col-span-3" role="status">{t("Escrow checkout is unavailable. The platform escrow wallet has not been configured.")}</p>}</>}
      {shop.shopMode==='personal'&&<fieldset className="rounded-xl border bg-white p-5 sm:col-span-3"><legend className="font-bold">{t('Refund & Delivery Policy')}</legend><label className="block">{t('Refund Policy (Required)')}<select required className={field} value={shop.refundPolicy||''} onChange={e=>setShop({...shop,refundPolicy:e.target.value as Shop['refundPolicy']})}><option value="">{t('Select a refund policy')}</option>{refundPolicies.map(policy=><option key={policy} value={policy}>{t(refundPolicyLabels[policy])}</option>)}</select></label><label className="mt-4 block">{t('Delivery Timeframe (Required)')}<textarea required maxLength={300} rows={2} className={field} value={shop.deliveryTimeframe||''} onChange={e=>setShop({...shop,deliveryTimeframe:e.target.value})}/></label><p className="mt-3 text-sm text-slate-600">{t('Include dispatch or digital delivery timing. Save Payment Settings to publish this policy.')}</p></fieldset>}
      {shop.shopMode==='personal'&&<PaymentSettingsEditor shop={shop} onChange={setShop} saving={publishing} message={paymentMessage} onSave={()=>void savePayments()}/>}

      {shop.shopMode==='personal'&&<label>{t('Seller USDC Wallet Address (Polygon)')}<input dir="ltr" className={field} maxLength={42} placeholder="0x..." value={shop.cryptoWallet||''} onChange={e=>setShop({...shop,cryptoWallet:e.target.value.trim()})}/></label>}
      <fieldset className="grid gap-4 rounded-xl border p-4 sm:col-span-3 sm:grid-cols-2"><legend className="font-bold">{t('Template Design')}</legend><label>{t('Hero Headline')}<input className={field} maxLength={140} value={shop.heroTitle||''} onChange={e=>setShop({...shop,heroTitle:e.target.value})}/></label><label>{t('Hero Subtitle')}<input className={field} maxLength={400} value={shop.heroSubtitle||''} onChange={e=>setShop({...shop,heroSubtitle:e.target.value})}/></label><label>{t('Hero Image URL')}<input type="url" className={field} value={shop.heroImage||''} onChange={e=>setShop({...shop,heroImage:e.target.value})}/></label><label>{t('Store Accent Palette')}<select className={field} value={shop.shopAccent||'emerald'} onChange={e=>setShop({...shop,shopAccent:e.target.value as typeof shopAccents[number]})}>{shopAccents.map((value,i)=><option key={value} value={value}>{t(shopAccentNames[i])}</option>)}</select></label><p className="text-sm text-slate-600 sm:col-span-2">{t('Design changes apply only to this storefront template.')}</p></fieldset>
      <label>{t("Shop Background Color")}<select className={field} value={shop.shopTheme} onChange={e=>setShop({...shop,shopTheme:e.target.value as Surface})}>{surfaces.map((surface,index)=><option key={surface} value={surface}>{t(surfaceNames[index])}</option>)}</select></label>
      <label>{t("Seller Email")}<input type="email" className={field} maxLength={254} value={shop.sellerEmail||''} onChange={e=>setShop({...shop,sellerEmail:e.target.value})}/></label><label>{t("Custom URL Slug")}<input dir="ltr" className={field} maxLength={64} value={shop.customSlug||''} onChange={e=>setShop({...shop,customSlug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}/></label><label>{t("Shop Name")}<input className={field} maxLength={100} value={shop.name} onChange={e=>setShop({...shop,name:e.target.value})}/></label>
      {shop.storeMode==='niche'&&<fieldset className="rounded-xl border bg-white p-4 sm:col-span-3"><label className="flex cursor-pointer items-center gap-3 font-semibold"><input type="checkbox" disabled={publishing} checked={shop.showMainStoreLink!==false} onChange={e=>{setShop({...shop,showMainStoreLink:e.target.checked});setStatus('');}}/>{t('Show link to my main store')}</label><p className="mt-2 text-sm text-slate-600">{t(shop.mainStoreSlug?'Visitors can browse all categories in your matching primary store.':'The link appears after your matching primary store is published.')}</p><button type="button" aria-busy={publishing} disabled={publishing} className={button+" mt-4"} onClick={()=>void saveStoreSettings()}>{status==='Store settings saved.'&&!publishing&&<span aria-hidden="true">✓ </span>}{t(publishing?'Saving…':'Save Store Settings')}</button></fieldset>}
      {shop.storeMode==='niche'&&<label>{t('Niche Name')}<input className={field} value={shop.nicheName||''} maxLength={100} onChange={e=>setShop({...shop,nicheName:e.target.value})}/></label>}
      <label>{t("Bio")}<input className={field} maxLength={500} value={shop.bio} onChange={e=>setShop({...shop,bio:e.target.value})}/></label><div className="sm:col-span-3"><CopyAssistant goal="bio" getInput={()=>({title:shop.name||shop.nicheName||'',description:shop.bio,destination:shop.shopMode})} onGenerated={copy=>setShop(current=>({...current,bio:copy.bio}))}/></div>
      <label>{t("WhatsApp Order Number")}<input className={field} dir="ltr" placeholder="+1 555 123 4567" value={shop.phone} onChange={e=>setShop({...shop,phone:e.target.value})}/></label>
      {!shop.phone.replace(/\D/g,"")&&<p className="text-sm sm:col-span-3">{t("Add your WhatsApp number in Shop Settings above to enable WhatsApp checkout.")}</p>}
<button type="button" className={button} disabled={publishing} onClick={()=>void saveStoreSettings()}>{t(publishing?'Saving.':'Save Store Settings')}</button>
    </section>}
    {workspace==='settings'&&!shared&&loaded&&<DeleteShopDialog key={shop.shopId||shop.shopMode} shop={shop} onDelete={deleteActiveNiche} disabled={publishing}/>}
    {workspace==='products'&&!preview&&!shared&&loaded&&<button className={button+' mb-6'} onClick={()=>{setEditing(null);setPhoto('');setAdding(!adding);}}>{t('Add Product')}</button>}
    {workspace==='products'&&adding&&!preview&&!shared && <form key={editing?.id || "new"} id="shop-product-form" className="mb-8 grid gap-4 rounded-xl border p-5 sm:grid-cols-2" onSubmit={e=>{
      e.preventDefault();const data=new FormData(e.currentTarget);
      const get=(key:string)=>String(data.get(key)||"").trim();


      const product:Product={aiGeneratedImage:draftAiImage,aiImagePrompt:draftAiPrompt,promoCaption:get("promoCaption"),keyHighlights:get("keyHighlights").split(/\n/).map(v=>v.trim()).filter(Boolean).slice(0,3),isDigital:draftDigital,digitalDeliveryNote:get("digitalDeliveryNote"),digitalDownloadUrl:get("digitalDownloadUrl"),promo_video_url:promoVideo(get("promo_video_url"))?.url||'',amazonImageBlocked:shop.shopMode==='affiliate'&&draftAmazonBlocked,stockPhoto:draftStock,unbrandedQuery:unbrandedQuery(get("name"),get("category"),get("gender")),photoResolvedFor:draftStock?unbrandedQuery(get("name"),get("category"),get("gender")):undefined,editorialCover:undefined,identityOverride,stock:get('stock')===''?undefined:Math.min(1000000,Math.max(0,Math.trunc(Number(get('stock'))))),catalogMode:shop.shopMode,id:editing?.id || crypto.randomUUID(),name:get("name"),price:get("price"),compareAtPrice:get("compareAtPrice"),badge:get("badge") as DealBadge,category:get("category")||"Top Deals",gender:normalizeGender(get("gender")),image:shop.shopMode==='affiliate'?affiliateImage(photo||safeImage(get("image")),get("category"),identityOverride||get("name"),editorCover,get('gender'),get('url'),draftAmazonBlocked):photo||safeImage(get("image")),url:safeUrl(get("url")),source:get("source"),images:get("images").split(/\n/).filter(value=>value.trim()).map(value=>shop.shopMode==='affiliate'?affiliateImage(safeImage(value),get("category"),identityOverride||get("name"),undefined,get("gender"),get("url")):safeImage(value)).filter(Boolean).slice(0,8),description:get("description").slice(0,4000)};
      if(shop.shopMode==='affiliate'&&(isAmazonCdnImage(get("image"))||get("images").split(/\n/).some(isAmazonCdnImage)))setStatus(amazonImageNotice);
      setShop(validateShop({...shop,products:editing?shop.products.map(item=>item.id===editing.id?product:item):[...shop.products,product]}));
      setEditing(null);
      setAdding(false);setPhoto("");
    }}>
      {shop.storeMode==='niche'&&<input type="hidden" name="category" value={shop.nicheName||"Other"}/>}
      {(["Product Name","Price","Category","Image URL","Affiliate / Checkout URL"] as const).map((text,i)=>shop.storeMode==='niche'&&i===2?null:<Fragment key={text}><label>{t(text)}<input className={field} defaultValue={editing ? String(editing[["name","price","category","image","url"][i] as keyof Product]||"") : ""} name={["name","price","category","image","url"][i]} type={i===4?"url":"text"} onChange={e=>{if(i===4)setDraftUrl(e.target.value);if(i===0)setDraftTitle(e.target.value);if(i===2){setDraftCategory(e.target.value);if(e.target.value==='Digital Product')setDraftDigital(true);}}} onBlur={event=>{if(i===3&&shop.shopMode==='affiliate'&&isAmazonCdnImage(event.target.value)){const form=event.target.form;event.target.value=affiliateImage(event.target.value,String(new FormData(form!).get('category')||'Other'),identityOverride||draftTitle,editorCover);setPhoto(event.target.value);setImageNotice(true);setDraftAmazonBlocked(true);}else if(i===3){setDraftAiImage(false);setPhoto(safeImage(event.target.value));setEditorCover(undefined);setDraftStock(undefined);setDraftAmazonBlocked(false);}}} required={i===0||(i===4&&shop.shopMode==="affiliate")} maxLength={i===0?120:2048} list={i===2?"shop-categories":undefined}/></label>{i===0&&<div className="sm:col-span-2"><CopyAssistant getInput={productCopyInput} onGenerated={applyProductCopy}/></div>}</Fragment>)}
      {imageNotice&&shop.shopMode==='affiliate'&&<p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm sm:col-span-2">{t(amazonImageNotice)}</p>}
      <datalist id="shop-categories">{categories.slice(1).map(c=><option key={c} value={c}>{label(c)}</option>)}</datalist>
      <label>{t("Gender / Audience")}<select className={field} name="gender" onChange={e=>setDraftGender(normalizeGender(e.target.value))} defaultValue={editing?.gender || "unisex"}><option value="unisex">{t("All / Unisex")}</option><option value="men">{t("Men")}</option><option value="women">{t("Women")}</option><option value="kids">{t("Kids")}</option></select></label>
      <label>{t('Stock (Optional)')}<input type="number" name="stock" className={field} min={0} max={1000000} defaultValue={editing?.stock??''}/></label>
      <label>{t("Compare-at Price")}<input className={field} name="compareAtPrice" maxLength={50} defaultValue={editing?.compareAtPrice||""}/></label>
      <label>{t("Deal Badge")}<select className={field} name="badge" defaultValue={editing?.badge||"none"}>{dealBadges.map(badge=><option key={badge} value={badge}>{t(badge==="none"?"None":badge==="hot"?"Hot":badge==="sale"?"Sale":badge==="limited"?"Limited":"New")}</option>)}</select></label>
      <label className="sm:col-span-2">{t("Product Promo Video (Optional)")}<input className={field} type="url" name="promo_video_url" maxLength={2048} defaultValue={editing?.promo_video_url||''} placeholder="https://www.youtube.com/shorts/..." onBlur={e=>{if(e.target.value&&!promoVideo(e.target.value)){e.target.setCustomValidity(t("Use a supported HTTPS YouTube, TikTok, Instagram, Vimeo or MP4 link."));}else e.target.setCustomValidity('');}} onChange={e=>e.target.setCustomValidity('')}/><span className="mt-2 block text-xs text-slate-600">{t("Add your own product demo link. Leave empty to hide Watch Demo. Amazon listing videos are not imported.")}</span></label>
      {shop.shopMode==='personal'&&<fieldset className="rounded-xl border p-4 sm:col-span-2"><label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={draftDigital} onChange={e=>setDraftDigital(e.target.checked)}/>{t('Digital Product')}</label><p className="my-3 text-sm text-slate-600">{t('Digital items need no shipping address. Access is released after payment verification or seller confirmation.')}</p>{draftDigital&&<><label className="block">{t('Post-payment Delivery Note')}<textarea name="digitalDeliveryNote" className={field} maxLength={2000} defaultValue={editing?.digitalDeliveryNote||''}/></label><label className="mt-4 block">{t('Private Download Link')}<input type="url" name="digitalDownloadUrl" pattern="https://.*" className={field} maxLength={2048} defaultValue={editing?.digitalDownloadUrl||''}/></label><p className="mt-3 text-xs text-slate-600">{t('Saved privately. Never put download secrets in the public product description.')}</p></>}</fieldset>}
      <label className="sm:col-span-2">{t("3 Key Highlights")}<textarea name="keyHighlights" className={field} rows={3} defaultValue={(editing?.keyHighlights||[]).join("\n")}/></label><label className="sm:col-span-2">{t("Social Promo Caption")}<textarea name="promoCaption" className={field} rows={3} maxLength={2000} defaultValue={editing?.promoCaption||""}/></label>
      <label className="sm:col-span-2">{t("Product Description")}<textarea className={field} name="description" rows={3} maxLength={4000} defaultValue={editing?.description||""}/></label>
      <label className="sm:col-span-2">{t("Additional Product Photos")}<textarea className={field} name="images" rows={3} maxLength={16000} defaultValue={(editing?.images||[]).join("\n")} onBlur={e=>{if(shop.shopMode==='affiliate'&&e.target.value.split(/\n/).some(isAmazonCdnImage)){const category=String(new FormData(e.target.form!).get('category')||'Other');e.target.value=e.target.value.split(/\n/).map(value=>affiliateImage(value,category)).join('\n');setImageNotice(true);setDraftAmazonBlocked(true);}}}/><span className="text-xs">{t("One image URL per line (up to 8).")}</span></label>
      <label>{t("Source Badge")}<select className={field} name="source" defaultValue={editing?.source || "Other"}>{["Amazon","AliExpress","Shopify","WhatsApp Direct","Other"].map(c=><option key={c} value={c}>{c==="Other"?t("Other"):c}</option>)}</select></label>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white focus-within:ring-2 focus-within:ring-emerald-300">{t(shop.shopMode==='affiliate'?'Upload Custom Photo':'Upload Product Photo')}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{
        const file=e.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const scale=Math.min(1,600/Math.max(img.width,img.height));c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d")!.drawImage(img,0,0,c.width,c.height);setPhoto(c.toDataURL("image/jpeg",0.7));setEditorCover(undefined);setDraftStock(undefined);};img.src=String(reader.result);};reader.readAsDataURL(file);
      }}/></label>
      <div className="sm:col-span-2"><ProductImageGenerator getInput={productCopyInput} onUse={(source,prompt)=>{setPhoto(source);setDraftAiImage(true);setDraftAiPrompt(prompt);setDraftStock(undefined);setDraftAmazonBlocked(false);const input=document.querySelector<HTMLInputElement>('#shop-product-form input[name="image"]');if(input)input.value=source;}}/></div>
      {shop.shopMode==='affiliate'&&<AffiliateImageEditor autoMatch={amazonAffiliateProduct({url:draftUrl,image:photo||editing?.image,amazonImageBlocked:draftAmazonBlocked})} title={draftTitle} category={draftCategory} gender={draftGender} override={identityOverride} onOverride={setIdentityOverride} selected={editorCover} stockPhoto={draftStock} onPhoto={value=>{setDraftAiImage(false);setDraftStock(value);setPhoto(value.url);const input=document.querySelector<HTMLInputElement>('#shop-product-form input[name="image"]');if(input)input.value=value.url;}} customImage={photo||editing?.image||''} onSelect={niche=>{setEditorCover(niche);const value=studioCover(niche||extractProductIdentity(identityOverride||draftTitle,draftCategory).visualNiche);setPhoto(value);const field=document.querySelector<HTMLInputElement>('#shop-product-form input[name="image"]');if(field)field.value=value;}}/>}
      <button className={button}>{t("Save Product")}</button>
    </form>}
{workspace==='products'&&<>
    
    {!shared&&<p className="mb-4 text-sm text-slate-600">{t("Sample products are demonstrations. Replace their details and links before sharing.")}</p>}
    <div hidden={shop.storeMode==='niche'} style={shop.storeMode==='niche'?{display:'none'}:undefined} className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("Category")}>{options.map(c=><button className={filter===c?button:"rounded-lg border px-4 py-2"} key={c} onClick={()=>setFilter(c)} aria-pressed={filter===c}>{label(c)} ({c==="All"?shop.products.length:shop.products.filter(p=>p.category===c).length})</button>)}</div>
    <div role="group" aria-label={t("Gender / Audience")} className="mb-6 flex flex-wrap gap-2">
      {(["all","men","women","unisex","kids"] as const).map(value=><button type="button" key={value} aria-pressed={genderFilter===value} onClick={()=>setGenderFilter(value)} className={genderFilter===value?button:"rounded-lg border px-4 py-2"}>{t(value==="all"?"All":value==="men"?"Men":value==="women"?"Women":value==="kids"?"Kids":"Unisex")}</button>)}
    </div>
    {(shared||preview)?<><div id="store-collection" className="store-collection-heading"><h2>{t(shop.shopMode==='affiliate'?'The Curated Edit':'The Signature Collection')}</h2><span className="text-sm text-slate-600">{matches.length} {t('pieces to explore')}</span></div><StorefrontProducts onShare={p=>void share(p)} shop={shop} products={matches.slice(0,visible)} slug={publicSlug} snapshot={snapshot} onAdd={(p,q)=>changeCart(p.id,q)} onPay={(p,q)=>setCheckout(productCheckout(p,q))} onCod={(p,q)=>setCodLines([{product:p,quantity:q}])}/></>:(<>    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.slice(0,visible).map(p=><article key={p.id} data-clickable={shop.shopMode==='personal'?'true':undefined} onClick={e=>{if(shop.shopMode==="personal"&&!(e.target as HTMLElement).closest("a,button,input,textarea,select"))location.href=productPath(p.id,publicSlug,snapshot);}} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className={(shop.shopMode==="personal"?"cursor-pointer ":"")+"product-image-frame product-card-image aspect-[3/4] w-full bg-slate-200 flex items-center justify-center overflow-hidden rounded-xl"}>{p.image&&<img src={p.image} alt={p.name} className="h-full w-full object-cover object-top" onError={e=>{e.currentTarget.style.display="none";}}/>}</div>
      <p className="mt-3 text-xs text-emerald-800">{p.source}</p><h2 className="text-xl font-bold">{shop.shopMode==="personal"?<a href={productPath(p.id,publicSlug,snapshot)} className="hover:underline">{p.id.startsWith("sample-")?t(p.name as Message):p.name}</a>:p.id.startsWith("sample-")?t(p.name as Message):p.name}</h2><p className="my-2 font-semibold">{p.price} {p.compareAtPrice&&<del className="ms-2 text-sm font-normal text-slate-600">{p.compareAtPrice}</del>}</p>{p.badge&&p.badge!=="none"&&<span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold">{t(p.badge==="hot"?"Hot":p.badge==="sale"?"Sale":p.badge==="limited"?"Limited":"New")}</span>}{p.gender!=="unisex"&&<span className="mb-2 inline-block rounded-full bg-slate-50 px-3 py-1 text-xs">{t(p.gender==="men"?"Men":p.gender==="kids"?"Kids":"Women")}</span>}
      {p.description&&<p dir="auto" className="my-3 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
      {shop.shopMode==="affiliate"&&shop.affiliateDisclosure&&<p className="my-2 text-xs text-slate-600">{shop.affiliateDisclosure}</p>}
      <div className="flex flex-wrap gap-2 text-sm">{!shared&&<button type="button" className="rounded-lg border px-3 py-2" onClick={()=>editInStudio(p)}>{t('Edit in Creator Studio')}</button>}
        {shop.shopMode==="personal"&&<a className="rounded-lg border px-3 py-2" href={productPath(p.id,publicSlug,snapshot)}>{t("View Product")}</a>}
        {shop.shopMode==="personal"&&!shared&&<button type="button" className="rounded-lg border px-3 py-2" onClick={async()=>{try{const response=await fetch("/api/shops",{method:"POST",headers:{"Content-Type":"application/json",...shopHeaders(localStorage)},body:JSON.stringify(shop)});if(!response.ok)throw Error();const result=await response.json();setShareTarget({url:productShareUrl(productPath(p.id,result.slug)),title:p.name,product:true});}catch{setStatus("Publish your shop to create a shareable product link.");}}}>{t("Share Product")}</button>}
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
    {shop.shopMode==="personal"&&checkout&&<CryptoCheckout storeSlug={publicSlug} orderItems={checkout.items||[{id:checkout.product.id,quantity:1}]} product={checkout.product} orderDetails={checkout.details} shop={shop} onClose={()=>setCheckout(null)}/>}
    
{shared&&<BuyerStoreFooter storeSlug={publicSlug}/>}
  </>}<p role="status" className="my-4 text-emerald-800">{status&&t(status)}</p></main>;
}



