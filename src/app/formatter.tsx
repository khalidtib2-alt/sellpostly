"use client";
import PromoImageStudio from "./promo-image-studio";


import { useLanguage } from "./language-context";
import type { Message } from "./translations";
import { useRef, useState, type FormEvent } from "react";

type Post = { platform: string; text: string; url?: string };
type Mode = "seller" | "creator";

function sellerPosts(data: FormData, t: (message: Message) => string): Post[] {
  const read = (key: string) => String(data.get(key) ?? "").trim();
  const name = read("name").replace(/\*\*/g,"");
  const price = [read("price"), read("currency")].filter(Boolean).join(" ");
  const delivery = read("delivery");
  const features = featureLines(read("features"));
  const bullets = features.map(feature => "✅ " + feature).join("\n");
  const contact = read("contact");
  const order = "👉 " + t("Reply *ORDER* now to claim yours!") + (contact ? "\n" + contact : "");
  const location = delivery && t("Delivery / pickup") + ": " + delivery;
  const tag = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 35);
  const join = (...parts: string[]) => parts.filter(Boolean).join("\n");
  const caption = [name, price, features[0]].filter(Boolean).join(" · ");
  return [
    { platform: "WhatsApp Business", url: "https://web.whatsapp.com/", text: join("*" + name + "*", price && "💰 *" + t("Price") + ":* " + price, delivery && "🚚 *" + t("Delivery") + ":* " + delivery) + "\n\n" + bullets + "\n\n" + order },
    { platform: "Instagram", url: "https://www.instagram.com/", text: [features[0] ? name + " — " + features[0] : t("Discover") + " " + name, join(price, location, bullets), order, [tag && "#" + tag, t("#ShopNow #ProductFinds")].filter(Boolean).join(" ")].filter(Boolean).join("\n\n") },
    { platform: "Facebook Marketplace", url: "https://www.facebook.com/marketplace/", text: join(t("Product") + ": " + name, price && t("Price") + ": " + price, location, bullets && t("Features") + ":\n" + bullets, order) },
    { platform: "TikTok", url: "https://www.tiktok.com/", text: join(caption, order.replace(/\s+/g, " ") + " " + t("#ShopNow #ProductFinds")) },
    { platform: "Pinterest", url: "https://www.pinterest.com/", text: join(t("Pin Title") + ": " + name, t("SEO Pin Description") + ": " + join(name, bullets, order), [tag && "#"+tag, ...t("#Shopping #ProductIdeas #GiftIdeas #Style #Wishlist #Discoveries").split(" ").slice(tag?1:0)].join(" "), t("Recommended Board Name") + ": " + t("Product ideas") + " · " + name, t("Image Alt Text") + ": " + name) },
  ];
}

function creatorPosts(hook: string, t: (message: Message) => string): Post[] {
  const normalized = hook.replace(/\s+/g, " ").trim();
  const truncate = (limit: number, cta: string) => {
    limit -= Array.from(cta).length + 2;
    const characters = Array.from(normalized);
    return characters.length <= limit ? normalized : characters.slice(0, limit - 1).join("").trimEnd() + "…";
  };
  return [
    { platform: "LinkedIn", text: hook.split(/\n+/).map(line => line.trim()).filter(Boolean).join("\n\n") + "\n\n" + t("What has worked for you?") },
    { platform: "X (Twitter)", text: truncate(140, t("Your take?")) },
    { platform: "Threads", text: truncate(500, t("Share your experience below.")) },
  ];
}

const fieldStyle = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900";

function PostCard({ post, image }: { post: Post; image: Blob | null }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Message | "">("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(post.text);
      setStatus("Copied!");
    } catch {
      setStatus("Copy failed. Select the text to copy it manually.");
    }
  }

  function destination() {
    const text=encodeURIComponent(post.text);
    if(post.platform==="WhatsApp Business")return "https://whatsapp.com/send?text="+text;
    if(post.platform.startsWith("X"))return "https://twitter.com/intent/tweet?text="+text;
    if(post.platform==="Threads")return "https://threads.net/intent/post?text="+text;
    if(post.platform==="Pinterest")return "https://pinterest.com/pin/create/button/?description="+text+"&url="+encodeURIComponent("https://sellpostly.com");
    return post.url || "https://www.linkedin.com/";
  }
  async function send(withImage=false) {
    const file=image?new File([image],"sellpostly-promo.png",{type:"image/png"}):null;
    if(withImage && file && navigator.canShare?.({files:[file]})) {
      try {await navigator.share({files:[file],text:post.text});} catch(error) {
        if(!(error instanceof DOMException && error.name==="AbortError"))setStatus("Sharing failed. Copy the text or download the image.");
      }
      return;
    }
    const tab=window.open("about:blank","_blank");
    if(tab)tab.opener=null;
    try {
      if(withImage && image) {
        try {
          await navigator.clipboard.write([new ClipboardItem({"image/png":image,"text/plain":new Blob([post.text],{type:"text/plain"})})]);
          setStatus("Image copied! Press Ctrl+V in chat to attach photo.");
        } catch {
          const url=URL.createObjectURL(image);
          const link=document.createElement("a");link.href=url;link.download="sellpostly-promo.png";link.click();
          setTimeout(()=>URL.revokeObjectURL(url),10000);
          await navigator.clipboard.writeText(post.text);
          setStatus("Image downloaded. Attach it and paste the caption.");
        }
      } else {
        await navigator.clipboard.writeText(post.text);
        setStatus("Caption copied. Paste it on the platform.");
      }
      if(tab)tab.location.href=destination();
    } catch {if(tab)tab.close();setStatus("Sharing failed. Copy the text or download the image.");}
  }
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold">{post.platform}</h3>
      <p dir="auto" className="my-3 whitespace-pre-wrap break-words text-sm text-slate-700">{post.text}</p>
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <button type="button" onClick={copy} className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">{t("Copy Text")}</button>
        <button type="button" onClick={()=>send()} className="rounded-md border px-3 py-2">{t("Send Text")}</button>
        {image && <button type="button" onClick={()=>send(true)} className="rounded-md bg-emerald-700 px-3 py-2 text-white">{t("Send Image + Text")}</button>}
        {post.url && <a className="rounded-md border border-slate-200 px-3 py-2" href={post.url} target="_blank" rel="noopener noreferrer">{t("Open Platform")}</a>}
      </div>
      <p role="status" className="mt-1 text-sm text-emerald-800">{status && t(status)}</p>
    </article>
  );
}

export default function Formatter() {
  const { language, t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [promo,setPromo] = useState<Blob | null>(null);
  const [image,setImage] = useState("");
  const [draft,setDraft] = useState({name:"",price:""});
  const [busy,setBusy] = useState(false);
  const [importStatus,setImportStatus] = useState<Message | "">("");
  const [productUrl,setProductUrl] = useState("");
  const [currency,setCurrency] = useState("USD");
  const [mode, setMode] = useState<Mode>("seller");
  const [results, setResults] = useState<{ data: FormData | null; hook: string; version: number }>({ data: null, hook: "", version: 0 });
  const [error, setError] = useState<Message | "">("");
  const posts = results.data ? (mode === "seller" ? sellerPosts(results.data, t) : creatorPosts(results.hook, t)) : [];

  async function importProduct() {
    if(busy)return;
    setBusy(true);setImportStatus("");
    try {
      const response=await fetch("/api/import-product",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:productUrl})});
      if(!response.ok)throw Error();
      const product=await response.json();
      const form=formRef.current;
      if(!form)return;
      for(const [key,value] of Object.entries({name:product.name,price:product.price,features:product.description})) {
        const input=form.elements.namedItem(key) as HTMLInputElement | HTMLTextAreaElement | null;
        if(input)input.value=String(value??"");
      }
      const code=/^[A-Z]{3}$/.test(product.currency)?product.currency:"USD";
      setCurrency(code);setImage(product.image||"");
      setDraft({name:product.name,price:[product.price,code].filter(Boolean).join(" ")});
      setImportStatus("Product imported. Review the details before publishing.");
    } catch {setImportStatus("Import failed. The store may block access. Enter the details manually.");}
    finally {setBusy(false);}
  }


  function sample() {
    const names={en:"Everyday Travel Backpack",fr:"Sac à dos de voyage",ar:"حقيبة ظهر للسفر"};
    const features={en:"Padded laptop compartment\nWater-resistant fabric\nLightweight everyday design",fr:"Compartiment ordinateur rembourré\nTissu déperlant\nConception légère",ar:"حجرة مبطنة للحاسوب\nنسيج مقاوم لرذاذ الماء\nتصميم خفيف للاستخدام اليومي"};
    const form=formRef.current;if(!form)return;
    for(const [key,value] of Object.entries({name:names[language],price:"49",features:features[language]})) (form.elements.namedItem(key) as HTMLInputElement).value=value;
    setCurrency("USD");setDraft({name:names[language],price:"49 USD"});
    const canvas=document.createElement("canvas");canvas.width=800;canvas.height=800;
    const c=canvas.getContext("2d")!;c.fillStyle="#e2e8f0";c.fillRect(0,0,800,800);
    c.strokeStyle="#064e3b";c.lineWidth=28;c.strokeRect(300,130,200,130);
    c.fillStyle="#059669";c.beginPath();c.roundRect(200,200,400,470,65);c.fill();
    c.fillStyle="#064e3b";c.beginPath();c.roundRect(250,440,300,170,25);c.fill();
    setImage(canvas.toDataURL("image/png"));
  }
  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const required = String(data.get(mode === "seller" ? "name" : "hook") ?? "").trim();
    if (!required) {
      setError(mode === "seller" ? "Enter a product name." : "Enter a post or hook.");
      return;
    }
    setError("");
    setResults(previous => ({ data, hook: required, version: previous.version + 1 }));
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
      <h2 className="text-3xl font-bold tracking-tight">{t("Post Formatter")}</h2>
      <div role="group" aria-label={t("Formatter mode")} className="mt-5 inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(["seller", "creator"] as const).map(option => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => {
            if (mode === option) return;
            setMode(option);
            setError("");
            setResults(previous => ({ data: null, hook: "", version: previous.version + 1 }));
          }} className={"rounded-md px-4 py-2 text-sm font-semibold " + (mode === option ? "bg-emerald-700 text-white" : "text-slate-700")}>
            {option === "seller" ? t("Seller Mode") : t("Creator Mode")}
          </button>
        ))}
      </div>
      {mode === "seller" && <div className="mt-5 rounded-lg border border-emerald-200 bg-white p-4">
        <label className="font-semibold">{t("Auto-Fill From Product Link")}<input type="url" dir="ltr" aria-label={t("Public product URL")} placeholder="https://example.com/products/item" className={fieldStyle} value={productUrl} onChange={e=>setProductUrl(e.target.value)} /></label>
        <button type="button" disabled={busy || !productUrl.trim()} onClick={importProduct} className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">{t(busy?"Importing…":"Import Product")}</button>
        <button type="button" onClick={sample} className="ms-2 mt-2 rounded-lg border border-emerald-700 px-4 py-2 text-emerald-800">{t("Try Sample Product")}</button>
        <p role="status">{importStatus && (language === "en" && importStatus === "Import failed. The store may block access. Enter the details manually." ? "Stores such as Amazon may block server requests. While viewing the product, use the SellPostly Chrome Extension’s Import From Current Page button, or enter details manually." : t(importStatus))}</p>
      </div>}
      <form ref={formRef} onChange={event=>{
        const data=new FormData(event.currentTarget);
        setDraft({name:String(data.get("name")||""),price:[data.get("price"),data.get("currency")].filter(Boolean).join(" ")});
      }} key={mode} onSubmit={generate} className="mt-6 grid gap-4 text-sm font-medium sm:grid-cols-2">
        {mode === "seller" ? <>
          <label>{t("Product Name")}<input className={fieldStyle} name="name" dir="auto" placeholder={t("Wireless headphones")} required maxLength={120} /></label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label>{t("Price")}<input className={fieldStyle} name="price" dir="auto" placeholder="29" inputMode="decimal" maxLength={30} /></label>
            <label>{t("Currency")}<select className={fieldStyle} name="currency" value={currency} onChange={e=>setCurrency(e.target.value)}>{Array.from(new Set([currency, "USD", "CAD", "EUR", "GBP", "AUD", "MAD", "INR", "NGN", "MXN"])).map(currency => <option key={currency}>{currency}</option>)}</select></label>
          </div>
          <label>{t("Delivery / Location Info")}<input className={fieldStyle} name="delivery" dir="auto" placeholder={t("Local pickup or shipping")} maxLength={240} /></label>
          <label>{t("Contact / Order Link")}<input className={fieldStyle} name="contact" dir="auto" placeholder={t("Order link or contact details")} maxLength={300} /></label>
          <label className="sm:col-span-2">{t("Key Features")} <span className="font-normal text-slate-600">{t("(one per line)")}</span><textarea className={fieldStyle} name="features" dir="auto" placeholder={t("Battery life, materials, or sizes")} rows={4} maxLength={1500} /></label>
        </> : <label className="sm:col-span-2">{t("Core Post or Hook")}<textarea className={fieldStyle} name="hook" dir="auto" placeholder={t("Paste your draft or opening line")} rows={6} required maxLength={3000} /></label>}
        <div className="sm:col-span-2">
          <button className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white" type="submit">{t("Generate Posts")}</button>
          {error && <p role="alert" className="mt-2 text-red-700">{t(error)}</p>}
        </div>
      </form>
      {mode === "seller" && <PromoImageStudio name={draft.name} price={draft.price} importedImage={image} onImage={setPromo} />}
      <p role="status" className="sr-only">{posts.length ? posts.length + " · " + t("Posts generated.") : ""}</p>
      {posts.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2">{posts.map(post => <PostCard key={language + results.version + post.platform} post={post} image={promo} />)}</div>}
    </div>
  );
}

function featureLines(value: string) {
  return String(value).replace(/\*\*/g,"").split(/\n+|(?<=[.!?])\s+/)
    .map(line=>line.replace(/^[-•✅\s]+/u,"").trim())
    .filter(line=>line && !/^about this item$/i.test(line) && !/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line))
    .flatMap(line=>line.match(/.{1,100}(?:\s|$)|.{1,100}/g)||[]).map(line=>line.trim()).slice(0,4);
}

