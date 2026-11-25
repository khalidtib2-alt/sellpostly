'use client';
import {useState} from 'react';
import {useLanguage} from '../language-context';
import {generateProductSeo,type SeoProductCopy} from '../../lib/seo-product-copy';
const outputs=[['title','SEO Product Title'],['meta','Meta Description'],['keywords','Search Keywords'],['faq','Buyer FAQ'],['caption','Social Promo Caption'],['hashtags','Hashtags'],['prompt','Generated prompt']] as const;
export default function SeoPromptForm(){
 const {t,language}=useLanguage(),[title,setTitle]=useState(''),[facts,setFacts]=useState(''),[audience,setAudience]=useState(''),[value,setValue]=useState<SeoProductCopy|null>(null),[copied,setCopied]=useState(''),[error,setError]=useState(false);
 return <section className="mt-6 space-y-5" aria-label={t('Prompt Generator')}>
  <p className="text-slate-600">{t('Create editable SEO copy and a reusable writing prompt from your verified product details. Suggestions are generated locally; review them before publishing.')}</p>
  <form className="space-y-4" onSubmit={e=>{e.preventDefault();setCopied('');setError(false);setValue(generateProductSeo(title,facts,audience||t('Everyday Online Shoppers — Friendly & Clear'),t,language));}}>
   <label className="block font-semibold">{t('Keyword or Product/Topic')}<input required dir="auto" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label>
   <label className="block font-semibold">{t('Verified Product Details')}<textarea rows={4} dir="auto" maxLength={1500} value={facts} onChange={e=>setFacts(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label>
   <label className="block font-semibold">{t('Target Tone / Audience')}<input dir="auto" value={audience} maxLength={300} onChange={e=>setAudience(e.target.value)} placeholder={t('Everyday Online Shoppers — Friendly & Clear')} className="mt-2 w-full rounded-xl border bg-white p-3"/></label>
   <button className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">{t('Generate SEO Copy & Prompt')}</button>
  </form>
  {value&&<div key={language} className="space-y-5">{outputs.map(([key,label])=><label key={key} className="block rounded-xl border bg-white p-4 font-semibold">{t(label)}<textarea dir="auto" rows={key==='faq'||key==='prompt'?7:key==='caption'?4:2} value={value[key]} onChange={e=>{setValue({...value,[key]:e.target.value});setCopied('');}} className="mt-2 w-full rounded-lg border p-3 font-normal"/><button type="button" className="mt-2 rounded-lg border px-4 py-2 text-sm" onClick={async()=>{try{await navigator.clipboard.writeText(value[key]);setCopied(key);setError(false);}catch{setError(true);}}}>{t(copied===key?'Copied!':key==='prompt'?'Copy Prompt':'Copy Text')}</button></label>)}</div>}
  <p role="status">{error?t('Copy failed. Select the text to copy it manually.'):copied?t('Copied!'):''}</p>
 </section>;
}
