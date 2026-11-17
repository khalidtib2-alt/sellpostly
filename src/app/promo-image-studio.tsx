"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-context";

export default function PromoImageStudio({ name, price, importedImage, onImage }: { name: string; price: string; importedImage: string; onImage: (blob: Blob | null) => void }) {
  const { t, language } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [source,setSource] = useState("");
  const [format,setFormat] = useState("square");
  const [theme,setTheme] = useState("emerald");
  const [ready,setReady] = useState(false);
  const [failed,setFailed] = useState(false);
  useEffect(()=>{ setSource(importedImage); },[importedImage]);

  useEffect(()=>{
    const element=canvas.current;
    if(!element) return;
    const context=element.getContext("2d");
    if(!context) return;
    let cancelled=false;
    setReady(false);
    onImage(null);
    const height=format==="vertical"?1920:format==="pin"?1620:1080;
    element.width=1080; element.height=height;
    function draw(image?: HTMLImageElement) {
      if(cancelled || !context) return;
      const colors=theme==="slate"?["#0f172a","#ffffff","#059669"]:theme==="sand"?["#f5ead8","#34291e","#805729"]:["#ecfdf5","#064e3b","#047857"];
      context.fillStyle=colors[0]; context.fillRect(0,0,1080,height);
      const photoHeight=height-420;
      if(image) {
        const scale=Math.min(960/image.width,photoHeight/image.height);
        const width=image.width*scale, h=image.height*scale;
        context.drawImage(image,(1080-width)/2,40+(photoHeight-h)/2,width,h);
      }
      context.direction=language==="ar"?"rtl":"ltr";
      context.textAlign="center";
      context.fillStyle=colors[1]; context.font="bold 48px system-ui";
      const words=(name||t("Product Name")).split(/\s+/);
      const lines:string[]=[]; let line="";
      for(const word of words) {
        if(context.measureText(line+" "+word).width>940 && line) { lines.push(line); line=word; } else line=(line+" "+word).trim();
      }
      if(line)lines.push(line);
      lines.slice(0,3).forEach((text,index)=>context.fillText(text,540,height-320+index*58,940));
      if(price) {
        context.fillStyle=colors[2]; context.fillRect(210,height-138,660,80);
        context.fillStyle="#fff"; context.font="bold 44px system-ui"; context.fillText(price,540,height-84,620);
      }
      context.direction="ltr"; context.fillStyle=colors[1]; context.font="22px system-ui";
      context.fillText(t("Created with SellPostly.com"),540,height-20);
      setReady(true);
      if(image) element!.toBlob(blob=>{if(!cancelled)onImage(blob);},"image/png");
    }
    setFailed(false);
    if(!source){draw();return;}
    const image=new Image();
    image.onload=()=>draw(image);
    image.onerror=()=>{if(!cancelled){setFailed(true);draw();}};
    image.src=source;
    return ()=>{cancelled=true;};
  },[source,format,theme,name,price,language,t,onImage]);

  function download() {
    try {
      const link=document.createElement("a");
      link.download="sellpostly-promo.png";
      link.href=canvas.current!.toDataURL("image/png");
      link.click();
    } catch { setFailed(true); }
  }
  return <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
    <h3 className="text-xl font-bold">{t("Promo Image Studio")}</h3>
    <div className="my-4 grid gap-4 sm:grid-cols-3">
      <label className="cursor-pointer rounded-lg bg-emerald-700 p-3 text-white focus-within:ring-2">{t("Upload Product Photo")}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event=>{
        const file=event.target.files?.[0]; if(!file)return;
        if(file.size>10000000 || !["image/png","image/jpeg","image/webp"].includes(file.type)){setFailed(true);return;}
        const reader=new FileReader(); reader.onload=()=>setSource(String(reader.result));reader.onerror=()=>setFailed(true);reader.readAsDataURL(file);
      }} /></label>
      <label>{t("Format")}<select className="block w-full rounded border p-2" value={format} onChange={e=>setFormat(e.target.value)}>
        <option value="square">{t("Square 1:1")}</option><option value="vertical">{t("Vertical 9:16")}</option><option value="pin">{t("Pinterest Pin 2:3")}</option>
      </select></label>
      <label>{t("Color theme")}<select className="block w-full rounded border p-2" value={theme} onChange={e=>setTheme(e.target.value)}>
        <option value="emerald">{t("Emerald")}</option><option value="slate">{t("Midnight Slate")}</option><option value="sand">{t("Warm Sand")}</option>
      </select></label>
    </div>
    <canvas ref={canvas} aria-label={t("Promo preview")} className="mx-auto h-auto w-full max-w-sm border border-slate-200" />
    <button type="button" onClick={download} disabled={!ready} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">{t("Download Promo PNG")}</button>
    {failed && <p role="status">{t("Image unavailable. Upload a PNG, JPEG, or WebP under 10 MB.")}</p>}
  </section>;
}
