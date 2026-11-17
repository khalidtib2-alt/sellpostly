"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "./language-context";

export const surfaces = ["white","sand","mint","slate"] as const;
export type Surface = typeof surfaces[number];
export const surfaceNames = ["Clean White","Warm Sand","Soft Mint","Midnight Slate"] as const;
const accents = [
  ["emerald","Emerald","#047857"],["blue","Ocean Blue","#1d4ed8"],
  ["amber","Sunset Amber","#92400e"],["violet","Royal Violet","#6d28d9"],["rose","Rose Coral","#be123c"],
] as const;

export default function ThemePicker(){
  const {t}=useLanguage();
  const [surface,setSurface]=useState<Surface>("white");
  const [accent,setAccent]=useState("emerald");
  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem("sellpostly-appearance")||"{}");
      const next=surfaces.includes(saved.surface)?saved.surface:"white";
      const color=accents.some(([id])=>id===saved.accent)?saved.accent:"emerald";
      setSurface(next);setAccent(color);
      document.documentElement.dataset.surface=next;
      document.documentElement.dataset.accent=color;
    }catch{}
  },[]);
  function apply(next:Surface,color:string){
    setSurface(next);setAccent(color);
    document.documentElement.dataset.surface=next;
    document.documentElement.dataset.accent=color;
    try{localStorage.setItem("sellpostly-appearance",JSON.stringify({surface:next,accent:color}));}catch{}
  }
  return <details className="relative">
    <summary className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">{t("Theme & Color")}</summary>
    <div className="absolute end-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <label className="block text-sm font-semibold">{t("Page Surface")}
        <select className="mt-2 w-full rounded-lg border p-2" value={surface} onChange={e=>apply(e.target.value as Surface,accent)}>
          {surfaces.map((id,i)=><option key={id} value={id}>{t(surfaceNames[i])}</option>)}
        </select>
      </label>
      <fieldset className="mt-4"><legend className="text-sm font-semibold">{t("Brand Accent")}</legend>
        <div className="mt-2 flex flex-wrap gap-3">{accents.map(([id,label,color])=><button type="button" key={id} aria-label={t(label)} title={t(label)} aria-pressed={accent===id} onClick={()=>apply(surface,id)} className="h-9 w-9 rounded-full border-2 shadow-sm" style={{backgroundColor:color,borderColor:accent===id?"var(--text)":"transparent"}}><span className="text-white">{accent===id?"✓":""}</span></button>)}</div>
      </fieldset>
    </div>
  </details>;
}
