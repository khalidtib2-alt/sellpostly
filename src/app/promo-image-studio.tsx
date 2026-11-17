"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-context";

export default function PromoImageStudio({ name, price, delivery = "", importedImage, onImage }: { name: string; price: string; delivery?: string; importedImage: string; onImage: (blob: Blob | null) => void }) {
  const { t, language } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);

  const [zoom,setZoom] = useState(100);
  const [offsetX,setOffsetX] = useState(0);
  const [offsetY,setOffsetY] = useState(0);
  const [customTitle,setCustomTitle] = useState<string | null>(null);
  const [keyword,setKeyword] = useState("");
  const [textSize,setTextSize] = useState("medium");
  const [textPosition,setTextPosition] = useState("bottom");
  const title=customTitle ?? name;
  const cachedImage=useRef<HTMLImageElement | null>(null);
  function resetImage(){setZoom(100);setOffsetX(0);setOffsetY(0);}
  const [source,setSource] = useState("");
  const [format,setFormat] = useState("square");
  const [theme,setTheme] = useState("white");
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

      const colors=theme==="slate"?["#0f172a","#ffffff","#059669"]:theme==="sand"?["#f5ead8","#34291e","#805729"]:theme==="mint"?["#ecfdf5","#064e3b","#047857"]:["#ffffff","#0f172a","#047857"];
      context.globalCompositeOperation="source-over";
      context.fillStyle=colors[0];context.fillRect(0,0,1080,height);
      const footerY=Math.round(height*0.7);
      const photoTop=textPosition==="top"?360:0;
      const photoBottom=textPosition==="bottom"?footerY:height-40;
      const photoHeight=photoBottom-photoTop;
      if(image){
        const scale=Math.min(1000/image.width,(photoHeight-32)/image.height)*(zoom/100);
        const width=image.width*scale,h=image.height*scale;
        context.save();
        context.beginPath();context.rect(0,photoTop,1080,photoHeight);context.clip();
        if((theme==="sand"||theme==="mint")&&textPosition!=="badge")context.globalCompositeOperation="multiply";
        context.drawImage(image,(1080-width)/2+offsetX*5.4,photoTop+(photoHeight-h)/2+offsetY*photoHeight/200,width,h);
        context.globalCompositeOperation="source-over";
        context.restore();
      }
      context.direction=language==="ar"?"rtl":"ltr";
      context.textAlign="center";
      const requestedSize=textSize==="small"?36:textSize==="large"?60:48;
      const keywordHeight=keyword.trim()?48:0;
      const priceHeight=price?56:0;
      const deliveryHeight=delivery?30:0;
      const gap=8;
      const availableTitle=height-footerY-52-keywordHeight-priceHeight-deliveryHeight-gap*3;
      const fontSize=textPosition==="bottom"?Math.min(requestedSize,Math.max(22,Math.floor(availableTitle/3)-6)):requestedSize;
      context.font="bold "+fontSize+"px system-ui";
      const words=title.trim().split(/\s+/);
      const lines:string[]=[];let line="";
      for(const word of words){
        if(context.measureText(line+" "+word).width>920&&line){lines.push(line);line=word;}
        else line=(line+" "+word).trim();
      }
      if(line)lines.push(line);
      const visibleLines=lines.slice(0,3);
      const titleHeight=visibleLines.length*(fontSize+6);
      const groupHeight=titleHeight+keywordHeight+priceHeight+deliveryHeight+
        [titleHeight,keywordHeight,priceHeight,deliveryHeight].filter(Boolean).length*gap;
      let y=textPosition==="bottom"?height-44-groupHeight:textPosition==="top"?24:Math.round(height*0.45);
      if(textPosition==="badge"){
        context.fillStyle=colors[0];context.globalAlpha=0.94;
        context.fillRect(40,y-10,1000,groupHeight+20);context.globalAlpha=1;
      }
      context.textBaseline="top";
      context.fillStyle=colors[1];context.font="bold "+fontSize+"px system-ui";
      for(const text of visibleLines){context.fillText(text,540,y,920);y+=fontSize+6;}
      if(titleHeight)y+=gap;
      if(keywordHeight){
        context.font="bold 28px system-ui";
        const pillWidth=Math.min(920,context.measureText(keyword).width+48);
        context.fillStyle=colors[2];context.beginPath();context.roundRect(540-pillWidth/2,y,pillWidth,keywordHeight,24);context.fill();
        context.fillStyle="#fff";context.fillText(keyword,540,y+9,pillWidth-32);
        y+=keywordHeight+gap;
      }
      if(priceHeight){
        context.fillStyle=colors[2];context.beginPath();context.roundRect(210,y,660,priceHeight,12);context.fill();
        context.fillStyle="#fff";context.font="bold 36px system-ui";context.fillText(price,540,y+8,620);
        y+=priceHeight+gap;
      }
      if(deliveryHeight){
        context.fillStyle=colors[1];context.font="bold 26px system-ui";
        context.fillText(t("Delivery")+": "+delivery,540,y,920);
      }
      context.textBaseline="alphabetic";
      context.direction="ltr"; context.fillStyle=colors[1]; context.font="22px system-ui";
      context.fillText(t("Created with SellPostly.com"),540,height-20);
      setReady(true);
      if(image) { try { element!.toBlob(blob=>{if(!cancelled)onImage(blob);},"image/png"); } catch { setFailed(true);onImage(null); } }
    }
    setFailed(false);
    if(!source){draw();return;}
    if(cachedImage.current?.src === source && cachedImage.current.complete && cachedImage.current.naturalWidth){draw(cachedImage.current);return ()=>{cancelled=true;};}
    const image=new Image();
    image.crossOrigin="anonymous";
    image.onload=()=>{cachedImage.current=image;draw(image);};
    image.onerror=()=>{if(!cancelled){setFailed(true);draw();}};
    image.src=source;
    return ()=>{cancelled=true;};
  },[source,format,theme,title,keyword,textSize,textPosition,zoom,offsetX,offsetY,price,delivery,language,t,onImage]);

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
      <label className="cursor-pointer rounded-lg bg-emerald-700 p-3 text-white focus-within:ring-2">{t("Upload Product Photo")}<input id="upload-product-photo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event=>{
        const file=event.target.files?.[0]; if(!file)return;
        if(file.size>10000000 || !["image/png","image/jpeg","image/webp"].includes(file.type)){setFailed(true);return;}
        const reader=new FileReader(); reader.onload=()=>setSource(String(reader.result));reader.onerror=()=>setFailed(true);reader.readAsDataURL(file);
      }} /></label>
      <label>{t("Format")}<select className="block w-full rounded border p-2" value={format} onChange={e=>setFormat(e.target.value)}>
        <option value="square">{t("Square 1:1")}</option><option value="vertical">{t("Vertical 9:16")}</option><option value="pin">{t("Pinterest Pin 2:3")}</option>
      </select></label>
      <label>{t("Color theme")}<select className="block w-full rounded border p-2" value={theme} onChange={e=>setTheme(e.target.value)}>
        <option value="white">{t("Clean White")}</option><option value="sand">{t("Warm Sand")}</option><option value="mint">{t("Soft Mint")}</option><option value="slate">{t("Midnight Slate")}</option>
      </select></label>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <label>{t("Image Size")} <output>{zoom}%</output><input className="block w-full accent-emerald-700" type="range" min="50" max="150" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>
      <label>{t("Horizontal (X)")} <output>{offsetX}%</output><input className="block w-full accent-emerald-700" type="range" min="-100" max="100" value={offsetX} onChange={e=>setOffsetX(Number(e.target.value))}/></label>
      <label>{t("Vertical (Y)")} <output>{offsetY}%</output><input className="block w-full accent-emerald-700" type="range" min="-100" max="100" value={offsetY} onChange={e=>setOffsetY(Number(e.target.value))}/></label>
      <button type="button" onClick={resetImage} className="justify-self-start rounded-lg border border-emerald-700 px-4 py-2 font-semibold text-emerald-800">{t("Reset Image")}</button>
      <label>{t("Custom Title")}<input dir="auto" className="block w-full rounded border p-2" maxLength={160} value={title} onChange={e=>setCustomTitle(e.target.value)}/></label>
      <label>{t("Promo Keyword")}<input dir="auto" className="block w-full rounded border p-2" maxLength={60} placeholder={t("LIMITED DEAL")} value={keyword} onChange={e=>setKeyword(e.target.value)}/></label>
      <label>{t("Text Size")}<select className="block w-full rounded border p-2" value={textSize} onChange={e=>setTextSize(e.target.value)}>
        <option value="small">{t("Small")}</option><option value="medium">{t("Medium")}</option><option value="large">{t("Large")}</option>
      </select></label>
      <label>{t("Text Position")}<select className="block w-full rounded border p-2" value={textPosition} onChange={e=>setTextPosition(e.target.value)}>
        <option value="top">{t("Top Banner")}</option><option value="bottom">{t("Footer Bar")}</option><option value="badge">{t("Overlay Badge")}</option>
      </select></label>
    </div>
    <canvas ref={canvas} aria-label={t("Promo preview")} className="mx-auto h-auto w-full max-w-sm border border-slate-200" />
    <button type="button" onClick={download} disabled={!ready} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">{t("Download Promo PNG")}</button>
    {failed && <p role="status">{t("Image unavailable. Upload a PNG, JPEG, or WebP under 10 MB.")}</p>}
  </section>;
}

