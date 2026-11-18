"use client";
import { escrowReady, holdDays } from "./escrow-config";
import CartDrawer from "./cart-drawer";
import { cartTotal } from "./cart-data";

import CryptoCheckout from "./crypto-checkout";
import { useEffect, useState } from "react";
import { surfaces, surfaceNames, type Surface } from "../theme-picker";
import { useLanguage } from "../language-context";
import type { Message } from "../translations";
import { normalizeGender, type Gender, categories, decodeShop, safeImage, safeUrl, shopKey, validateShop, dealBadges, type DealBadge, type Product, type Shop } from "./shop-data";

const field="mt-1 block w-full rounded-lg border border-slate-300 p-2";
const button="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white";
function samples(): Shop {
  const products=["Wireless headphones","Travel backpack","Kitchen organizer","Fitness bottle"].map((name,index)=>{
    const canvas=document.createElement("canvas");canvas.width=320;canvas.height=240;
    const context=canvas.getContext("2d")!;context.fillStyle=["#d1fae5","#e2e8f0","#fef3c7","#fce7f3"][index];context.fillRect(0,0,320,240);
    context.font="80px system-ui";context.textAlign="center";context.fillText(["🎧","🎒","🍽️","💧"][index],160,145);
    return {gender:"unisex" as const,id:"sample-"+index,name,price:["49 USD","39 USD","24 USD","19 USD"][index],category:["Tech & Gadgets","Fashion","Home & Kitchen","Fitness"][index],image:canvas.toDataURL(),url:["https://www.amazon.com/","https://www.aliexpress.com/","https://www.shopify.com/","https://www.amazon.com/"][index],source:["Amazon","AliExpress","Shopify","Amazon"][index]};
  });
  return {name:"My Shop",bio:"",phone:"",shopMode:"affiliate",shopTheme:"white",products};
}
export default function ShopBuilder({isSharedBuyerView=false,initialShop}:{isSharedBuyerView?:boolean;initialShop?:Shop}){
  const {t,language,setLanguage}=useLanguage();
  const [shop,setShop]=useState<Shop>({name:"",bio:"",phone:"",shopMode:"affiliate",shopTheme:"white",products:[]});
  const [loaded,setLoaded]=useState(false),[shared,setShared]=useState(isSharedBuyerView),[preview,setPreview]=useState(isSharedBuyerView),[adding,setAdding]=useState(false);
  const [checkout,setCheckout]=useState<{product:Product;details:string} | null>(null);
  const [cart,setCart]=useState<Record<string,number>>({});
  const [cartOpen,setCartOpen]=useState(false);
  const [editing,setEditing]=useState<Product | null>(null);
  const [genderFilter,setGenderFilter]=useState<Gender | "all">("all");
  const [search,setSearch]=useState("");
  const [visible,setVisible]=useState(24);
  const [filter,setFilter]=useState("All"),[photo,setPhoto]=useState(""),[status,setStatus]=useState<Message|"">("");
  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(initialShop){setShop(initialShop);setShared(true);setPreview(true);setLoaded(true);return;}
      const params=new URLSearchParams(location.search);
      try{
        if(isSharedBuyerView || params.has("s")){
          const decoded=await decodeShop(params.get("s")!);if(cancelled)return;
          setShop(decoded);setShared(true);setPreview(true);
        } else {
          let initial=samples();
          try {const saved=localStorage.getItem(shopKey);if(saved)initial=validateShop(JSON.parse(saved));}catch{}
          if(params.get("addTitle")){
            const product:Product={id:crypto.randomUUID(),name:params.get("addTitle")!.slice(0,120),price:(params.get("addPrice")||"").slice(0,50),image:safeImage(params.get("addImage")||""),url:safeUrl(params.get("addUrl")||""),gender:normalizeGender(params.get("addGender")),category:(params.get("addCategory")||"Top Deals").slice(0,80),source:"Other"};
            initial.products.push(product);
            setFilter(product.category);
            try {localStorage.setItem(shopKey,JSON.stringify(initial));}catch{setStatus("Could not save. Device storage may be full.");}
            history.replaceState(null,"",location.pathname);
          }

          try {
            const pending=localStorage.getItem("sellpostly_pending_shop_item");
            if(pending){
              const item=JSON.parse(pending);
              if(!item || typeof item.title!=="string" || !item.title.trim())throw Error("Invalid product");
              const product:Product={
                id:typeof item.id==="string" && item.id ? item.id : crypto.randomUUID(),
                name:item.title.slice(0,120),
                price:typeof item.price==="string"?item.price:"",
                image:safeImage(typeof item.image==="string"?item.image:""),
                url:safeUrl(typeof item.url==="string"?item.url:""),
                gender:normalizeGender(item.gender),
                category:typeof item.category==="string" && item.category?item.category.slice(0,80):"Top Deals",
                source:typeof item.source==="string"?item.source:"Other"
              };
              if(!initial.products.some(existing=>existing.id===product.id))initial.products.push(product);
              // Commit the catalog before removing the recoverable pending item.
              localStorage.setItem(shopKey,JSON.stringify(initial));
              localStorage.removeItem("sellpostly_pending_shop_item");
              setFilter(product.category);
              setStatus("Product added to My Shop!");
            }
          }catch{setStatus("Could not save. Device storage may be full.");}
          if(cancelled)return;setShop(initial);
        }
      }catch{setStatus("Could not open this shop link.");}
      if(!cancelled)setLoaded(true);
    }
    load();return()=>{cancelled=true;};
  },[initialShop,isSharedBuyerView]);
  useEffect(()=>{if(loaded&&!shared)try{localStorage.setItem(shopKey,JSON.stringify(shop));}catch{setStatus("Could not save. Device storage may be full.");}},[shop,loaded,shared]);
  async function share(){
    try{
      const key=localStorage.getItem("sellpostly-pro-key")||"";
      const response=await fetch("/api/shops",{method:"POST",headers:{"Content-Type":"application/json","x-pro-key":key},body:JSON.stringify(shop)});
      if(!response.ok)throw Error();
      const result=await response.json();
      await navigator.clipboard.writeText(location.origin+result.url);setStatus("Copied!");
    }catch{setStatus("Could not publish the shop. Check your Pro license and database setup.");}
  }
  function createPost(product:Product){
    try{sessionStorage.setItem("sellpostly-post",JSON.stringify(product));location.href="/#formatter";}catch{setStatus("Could not save. Device storage may be full.");}
  }

  const lines=shop.products.filter(product=>cart[product.id]>0).map(product=>({product,quantity:cart[product.id]}));
  const count=lines.reduce((sum,line)=>sum+line.quantity,0);
  const total=cartTotal(lines);
  function changeCart(id:string,delta:number){setCart(previous=>({...previous,[id]:Math.max(0,Math.min(99,(previous[id]||0)+delta))}));}
  useEffect(()=>{setCart({});setCartOpen(false);setCheckout(null);},[shop.shopMode]);
  const options=[...categories,...new Set(shop.products.map(p=>p.category).filter(c=>!categories.includes(c as typeof categories[number])))];
  const matches=shop.products.filter(p=>(filter==="All"||p.category===filter) && (genderFilter==="all"||p.gender===genderFilter) && (p.name+" "+p.category+" "+p.source).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  useEffect(()=>setVisible(24),[filter,genderFilter,search]);
  function label(value:string){return categories.includes(value as typeof categories[number])?t(value as Message):value;}
  return <main data-surface={shop.shopTheme} className="shop-surface mx-auto max-w-6xl px-5 py-12">
<header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
<div><div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black text-emerald-800">{shop.logo?<img src={shop.logo} alt={shop.name} className="max-h-full max-w-full object-contain"/>:(shop.name||"SP").trim().slice(0,2).toUpperCase()}</div><h1 className="text-4xl font-black">{shop.name==="My Shop"||!shop.name?t("My Shop"):shop.name}</h1><p className="mt-3 whitespace-pre-line text-slate-600">{shop.bio}</p></div>
{shared&&<div role="group" aria-label={t("Language")} className="flex gap-1 rounded-full border border-slate-300 bg-white p-1 text-slate-900">
{(["en","fr","ar"] as const).map(value=><button type="button" key={value} lang={value} aria-pressed={language===value} onClick={()=>setLanguage(value)} className={language===value?"rounded-full bg-emerald-700 px-3 py-2 text-sm font-semibold text-white":"rounded-full px-3 py-2 text-sm font-semibold"}>{value==="ar"?"العربية":value.toUpperCase()}</button>)}
</div>}</header>
{!loaded&&<p role="status">{t("Loading storefront…")}</p>}
    <label className="mb-4 block">{t("Search Products")}<input type="search" className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label>
    {!shared&&<div className="mb-6 flex flex-wrap gap-3">
      {!shared && <><button className={button} onClick={()=>setPreview(false)}>{t("Builder")}</button><button className={button} onClick={()=>setPreview(true)}>{t("Storefront Preview")}</button></>}
      <button className={button} disabled={!loaded} onClick={share}>{t("Copy Shareable Shop Link")}</button>
    </div>}
    {!shared&&<p className="mb-4 text-sm text-slate-600">{t("Publish your latest changes to update your public storefront.")}</p>}
    {!preview&&!shared&&loaded && <section className="mb-8 grid gap-4 rounded-xl border bg-slate-50 p-5 sm:grid-cols-3">
      <fieldset className="sm:col-span-3"><legend className="mb-2 font-semibold">{t("Shop Type")}</legend><div className="flex flex-wrap gap-3">{(["affiliate","personal"] as const).map(mode=><button type="button" key={mode} aria-pressed={shop.shopMode===mode} className={shop.shopMode===mode?button:"rounded-lg border px-4 py-2"} onClick={()=>setShop({...shop,shopMode:mode})}>{t(mode==="affiliate"?"Affiliate Storefront":"Personal Seller Store")}</button>)}</div></fieldset>
      {shop.shopMode==="affiliate"&&<label className="sm:col-span-3">{t("Affiliate Disclosure (Optional)")}<textarea className={field} maxLength={500} value={shop.affiliateDisclosure||""} onChange={e=>setShop({...shop,affiliateDisclosure:e.target.value})}/></label>}
      <label>{t("Store Logo")}<input type="file" accept="image/png,image/jpeg,image/webp" className={field} onChange={event=>{
        const file=event.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");const scale=Math.min(1,256/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);setShop(previous=>({...previous,logo:canvas.toDataURL("image/png")}));};image.src=String(reader.result);};reader.readAsDataURL(file);
      }}/>{shop.logo&&<button type="button" className="mt-2 text-sm underline" onClick={()=>setShop({...shop,logo:""})}>{t("Remove Logo")}</button>}</label>
      <label>{t("Escrow Hold Period")}<select className={field} value={holdDays(shop.escrowHoldDays)} onChange={e=>setShop({...shop,escrowHoldDays:Number(e.target.value)})}>{Array.from({length:13},(_,i)=>i+3).map(days=><option key={days} value={days}>{days} {t("days")}</option>)}</select></label>
      <p className="text-sm">{t("Escrow settings are recorded for future verified payments. Automatic release is not enabled in Milestone 1.")}</p>
      {!escrowReady&&<p className="text-sm sm:col-span-3" role="status">{t("Escrow checkout is unavailable. The platform escrow wallet has not been configured.")}</p>}
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


      const product:Product={id:editing?.id || crypto.randomUUID(),name:get("name"),price:get("price"),compareAtPrice:get("compareAtPrice"),badge:get("badge") as DealBadge,category:get("category")||"Top Deals",gender:normalizeGender(get("gender")),image:photo||safeImage(get("image")),url:safeUrl(get("url")),source:get("source")};
      setShop({...shop,products:editing?shop.products.map(item=>item.id===editing.id?product:item):[...shop.products,product]});
      setEditing(null);
      setAdding(false);setPhoto("");
    }}>
      {(["Product Name","Price","Category","Image URL","Affiliate / Checkout URL"] as const).map((text,i)=><label key={text}>{t(text)}<input className={field} defaultValue={editing ? editing[["name","price","category","image","url"][i] as keyof Product] : ""} name={["name","price","category","image","url"][i]} type={i===3||i===4?"url":"text"} required={i===0||(i===4&&shop.shopMode==="affiliate")} maxLength={i===0?120:2048} list={i===2?"shop-categories":undefined}/></label>)}
      <datalist id="shop-categories">{categories.slice(1).map(c=><option key={c} value={c}>{label(c)}</option>)}</datalist>
      <label>{t("Gender / Audience")}<select className={field} name="gender" defaultValue={editing?.gender || "unisex"}><option value="unisex">{t("All / Unisex")}</option><option value="men">{t("Men")}</option><option value="women">{t("Women")}</option></select></label>
      <label>{t("Compare-at Price")}<input className={field} name="compareAtPrice" maxLength={50} defaultValue={editing?.compareAtPrice||""}/></label>
      <label>{t("Deal Badge")}<select className={field} name="badge" defaultValue={editing?.badge||"none"}>{dealBadges.map(badge=><option key={badge} value={badge}>{t(badge==="none"?"None":badge==="hot"?"Hot":badge==="sale"?"Sale":badge==="limited"?"Limited":"New")}</option>)}</select></label>
      <label>{t("Source Badge")}<select className={field} name="source" defaultValue={editing?.source || "Other"}>{["Amazon","AliExpress","Shopify","WhatsApp Direct","Other"].map(c=><option key={c} value={c}>{c==="Other"?t("Other"):c}</option>)}</select></label>
      <label>{t("Upload Product Photo")}<input className={field} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{
        const file=e.target.files?.[0];if(!file)return;
        if(file.size>5000000){setStatus("Photo must be under 5 MB.");return;}
        const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const scale=Math.min(1,600/Math.max(img.width,img.height));c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d")!.drawImage(img,0,0,c.width,c.height);setPhoto(c.toDataURL("image/jpeg",0.7));};img.src=String(reader.result);};reader.readAsDataURL(file);
      }}/></label>
      <button className={button}>{t("Save Product")}</button>
    </form>}
    
    {!shared&&<p className="mb-4 text-sm text-slate-600">{t("Sample products are demonstrations. Replace their details and links before sharing.")}</p>}
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("Category")}>{options.map(c=><button className={filter===c?button:"rounded-lg border px-4 py-2"} key={c} onClick={()=>setFilter(c)} aria-pressed={filter===c}>{label(c)} ({c==="All"?shop.products.length:shop.products.filter(p=>p.category===c).length})</button>)}</div>
    <div role="group" aria-label={t("Gender / Audience")} className="mb-6 flex flex-wrap gap-2">
      {(["all","men","women","unisex"] as const).map(value=><button type="button" key={value} aria-pressed={genderFilter===value} onClick={()=>setGenderFilter(value)} className={genderFilter===value?button:"rounded-lg border px-4 py-2"}>{t(value==="all"?"All":value==="men"?"Men":value==="women"?"Women":"Unisex")}</button>)}
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.slice(0,visible).map(p=><article key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className="product-image-frame h-52 w-full bg-slate-50 p-4 flex items-center justify-center overflow-hidden rounded-xl">{p.image&&<img src={p.image} alt={p.name} className={"max-h-full max-w-full w-auto h-auto object-contain "+(shop.shopTheme==="slate"?"":"mix-blend-multiply")} onError={e=>{e.currentTarget.style.display="none";}}/>}</div>
      <p className="mt-3 text-xs text-emerald-800">{p.source}</p><h2 className="text-xl font-bold">{p.id.startsWith("sample-")?t(p.name as Message):p.name}</h2><p className="my-2 font-semibold">{p.price} {p.compareAtPrice&&<del className="ms-2 text-sm font-normal text-slate-600">{p.compareAtPrice}</del>}</p>{p.badge&&p.badge!=="none"&&<span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold">{t(p.badge==="hot"?"Hot":p.badge==="sale"?"Sale":p.badge==="limited"?"Limited":"New")}</span>}{p.gender!=="unisex"&&<span className="mb-2 inline-block rounded-full bg-slate-50 px-3 py-1 text-xs">{t(p.gender==="men"?"Men":"Women")}</span>}
      {shop.shopMode==="affiliate"&&shop.affiliateDisclosure&&<p className="my-2 text-xs text-slate-600">{shop.affiliateDisclosure}</p>}
      <div className="flex flex-wrap gap-2 text-sm">
        {shop.shopMode==="personal"&&<button type="button" className={button} onClick={()=>changeCart(p.id,1)}>{t("Add to Cart")}</button>}
        {shop.shopMode==="personal"&&<button type="button" className={button} onClick={()=>setCheckout({product:p,details:""})}>{t("Pay with USDC / USDT")}</button>}
        {shop.shopMode==="affiliate"&&p.url&&<a className={button} href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer sponsored">{t("View Deal / Buy Now")}</a>}
        {shop.shopMode==="personal"&&shop.phone.replace(/\D/g,"")&&<a className="rounded-lg border px-3 py-2" href={"https://wa.me/"+shop.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(t("I would like to order")+" "+p.name+" "+p.price)} target="_blank" rel="noopener noreferrer">{t("Order via WhatsApp")}</a>}
        {!shared&&<button className="rounded-lg border px-3 py-2" onClick={()=>createPost(p)}>{t("Create Social Post")}</button>}
        {!shared&&!preview&&<button className="rounded-lg border px-3 py-2" onClick={()=>{setEditing(p);setPhoto("");setAdding(true);setTimeout(()=>document.getElementById("shop-product-form")?.scrollIntoView({behavior:"smooth"}),0);}}>{t("Edit Product")}</button>}
        {!shared&&!preview&&<button className="rounded-lg border px-3 py-2" onClick={()=>setShop({...shop,products:shop.products.filter(item=>item.id!==p.id)})}>{t("Remove")}</button>}
      </div>
    </article>)}</div>
    {matches.length===0&&loaded&&<p>{t("No products found.")}</p>}
    {matches.length>visible&&<button type="button" className={button+" mt-6"} onClick={()=>setVisible(count=>count+24)}>{t("Load More")}</button>}
    {shop.shopMode==="personal"&&<button type="button" onClick={()=>setCartOpen(true)} className="fixed bottom-5 end-5 z-30 rounded-full bg-emerald-700 px-5 py-3 font-bold text-white shadow-lg">{t("Cart")} ({count}) · {total?(total.currency==="USD"?"$":"")+total.amount+(total.currency!=="USD"?" "+total.currency:""):"—"}</button>}
    {shop.shopMode==="personal"&&cartOpen&&<CartDrawer isSharedBuyerView={shared} lines={lines} shop={shop} change={changeCart} onClose={()=>setCartOpen(false)} onPay={(product,details)=>setCheckout({product,details})}/>}
    {checkout&&<CryptoCheckout product={checkout.product} orderDetails={checkout.details} shop={shop} onClose={()=>setCheckout(null)}/>}
    <p role="status" className="my-4 text-emerald-800">{status&&t(status)}</p>
{shared&&<footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-600"><a href="/shop" className="underline">{t("Edit My Own Shop")}</a></footer>}
  </main>;
}

