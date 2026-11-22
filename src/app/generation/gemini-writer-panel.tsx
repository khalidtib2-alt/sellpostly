'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '../language-context';
import {copyInput,requestCopy,type CopyResult} from '../../lib/generation-data';
import {diagnosticLabels} from '../../lib/generation-diagnostics';
import {readShopList,shopSelection} from '../shop/multi-shop-data';
import {shopKey,validateShop,type Product,type ShopMode} from '../shop/shop-data';

type Choice={id:string;label:string;product:Product;destination:ShopMode};
export default function GeminiWriterPanel({initialKeyword='',onUse}:{initialKeyword?:string;onUse?:(text:string)=>void}){
 const {t,language}=useLanguage();
 const [keyword,setKeyword]=useState(initialKeyword),[facts,setFacts]=useState(''),[tone,setTone]=useState(''),[goal,setGoal]=useState<'content'|'script'>('content');
 const [choices,setChoices]=useState<Choice[]>([]),[selected,setSelected]=useState(''),[result,setResult]=useState<CopyResult|null>(null),[busy,setBusy]=useState(false),[copied,setCopied]=useState(''),[error,setError]=useState(false);
 const alive=useRef(true),revision=useRef(0);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;revision.current++;};},[]);
 useEffect(()=>{setKeyword(initialKeyword);setSelected('');revision.current++;},[initialKeyword]);
 useEffect(()=>{setResult(null);setCopied('');revision.current++;},[language]);
 useEffect(()=>{function load(){try{let shops=readShopList(localStorage);if(!shops.length&&localStorage.getItem(shopKey))shops=[validateShop(JSON.parse(localStorage.getItem(shopKey)!))];setChoices(shops.flatMap(shop=>shop.products.map(product=>({id:shopSelection(shop)+':'+product.id,label:shop.name+' — '+product.name,product,destination:shop.shopMode}))).slice(0,1000));}catch{setChoices([]);}}load();window.addEventListener('focus',load);return()=>window.removeEventListener('focus',load);},[]);
 const field='mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900';
 async function generate(){if(!keyword.trim())return;const version=++revision.current;setBusy(true);setError(false);setCopied('');const choice=choices.find(c=>c.id===selected);
  try{const value=await requestCopy(copyInput({title:keyword,description:facts,category:choice?.product.category||'',price:choice?.product.price||'',destination:choice?.destination||'personal',language,goal,tone}));if(alive.current&&version===revision.current)setResult(value);}catch{if(alive.current)setError(true);}finally{if(alive.current)setBusy(false);}}
 async function copy(kind:'prompt'|'content'){try{await navigator.clipboard.writeText(kind==='prompt'?result!.prompt:goal==='script'?result!.script:result!.caption);setCopied(kind);setError(false);}catch{setError(true);}}
 return <section className="my-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6" aria-label={t('Gemini Writer Panel')}>
  <h2 className="text-xl font-bold">{t('Gemini Writer Panel')}</h2>
  <p className="mt-2 text-sm text-slate-700">{t('Create an editable AI prompt and ready-to-post caption or video script without leaving this page.')}</p>
  <div className="mt-5 grid gap-4 sm:grid-cols-2">
   <label>{t('Keywords / Product Topic')}<input dir="auto" className={field} value={keyword} maxLength={160} onChange={e=>{setKeyword(e.target.value);setSelected('');revision.current++;}} placeholder={t('Wireless headphones')}/></label>
   <label>{t('Or Pick a Saved Product')}<select className={field} value={selected} onChange={e=>{setSelected(e.target.value);const item=choices.find(c=>c.id===e.target.value);if(item){setKeyword(item.product.name);setFacts([item.product.description,...(item.product.keyHighlights||[])].filter(Boolean).join('\n').slice(0,1500));}revision.current++;}}><option value="">{t('Write from keywords')}</option>{choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
   <label>{t('Helper Output')}<select className={field} value={goal} onChange={e=>{setGoal(e.target.value as typeof goal);setResult(null);revision.current++;}}><option value="content">{t('Social Promo Caption')}</option><option value="script">{t('Promo Script')}</option></select></label>
   <label>{t('Target Tone / Audience')}<input dir="auto" className={field} maxLength={300} value={tone} onChange={e=>{setTone(e.target.value);revision.current++;}}/></label>
   <label className="sm:col-span-2">{t('Verified Product Details')}<textarea dir="auto" className={field} rows={3} maxLength={1500} value={facts} onChange={e=>{setFacts(e.target.value);revision.current++;}}/></label>
  </div>
  <button type="button" onClick={generate} disabled={busy||!keyword.trim()} aria-busy={busy} className="mt-4 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{t(busy?'Generating…':'Generate Prompt & Content')}</button>
  <p className="mt-3 text-xs text-slate-600">{t('Optional Gemini generation sends entered text to Google when configured. No product photos are uploaded. Review every result before publishing.')}</p>
  {result?.diagnostic&&<p role="status" className="mt-3 text-sm text-amber-900">{t(diagnosticLabels[result.diagnostic.code])}</p>}
  {error&&<p role="alert" className="mt-3">{t('Copy failed. Select the text to copy it manually.')}</p>}
  {result&&<div className="mt-5 space-y-4"><p role="status" className="text-sm font-semibold">{t(result.source==='gemini'?'Generated with Gemini. Review and edit before publishing.':'Local template used. Review and edit before publishing.')}</p>
   <label className="block">{t('Editable AI Prompt')}<textarea dir="auto" rows={6} className={field} value={result.prompt} onChange={e=>{setResult({...result,prompt:e.target.value});setCopied('');}}/></label>
   <button type="button" onClick={()=>copy('prompt')} className="rounded-lg border border-emerald-700 bg-white px-4 py-2 font-semibold">{t(copied==='prompt'?'Copied!':'Copy Prompt')}</button>
   <label className="block">{t(goal==='script'?'Promo Script':'Social Promo Caption')}<textarea dir="auto" rows={7} className={field} value={goal==='script'?result.script:result.caption} onChange={e=>{setResult({...result,[goal==='script'?'script':'caption']:e.target.value});setCopied('');}}/></label>
   <div className="flex flex-wrap gap-3"><button type="button" onClick={()=>copy('content')} className="rounded-lg border border-emerald-700 bg-white px-4 py-2 font-semibold">{t(copied==='content'?'Copied!':'Copy Generated Text')}</button>{onUse&&<button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={()=>onUse(goal==='script'?result.script:result.caption)}>{t('Use in Post Formatter')}</button>}</div>
  </div>}
 </section>;
}
