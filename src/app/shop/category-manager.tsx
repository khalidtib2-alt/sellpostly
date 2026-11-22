'use client';
import {useState} from 'react';
import {useLanguage} from '../language-context';
import {addCustomCategory,categoryKey,categoryOptions,catalogExport,catalogFilename} from './category-data';
import type {Shop} from './shop-data';
import type {Message} from '../translations';
export default function CategoryManager({shop,onChange}:{shop:Shop;onChange:(shop:Shop)=>void}){
 const {t}=useLanguage(),[name,setName]=useState(''),[status,setStatus]=useState<Message|''>('');
 const rows=categoryOptions(shop,true),label=(name:string)=>t(name as Message);
 function add(){if(rows.some(c=>categoryKey(c.name)===categoryKey(name)||categoryKey(label(c.name))===categoryKey(name))){setStatus('This category already exists.');return;}try{onChange(addCustomCategory(shop,name));setName('');setStatus('Category added.');}catch(error){setStatus(error instanceof Error&&error.message==='CATEGORY_LIMIT'?'Category limit reached.':'Enter a category name.');}}
 async function copy(){try{await navigator.clipboard.writeText(JSON.stringify(catalogExport(shop),null,2));setStatus('Copied!');}catch{setStatus('Copy failed. Download the JSON file instead.');}}
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(catalogExport(shop),null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=catalogFilename(shop);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Downloaded!');}
 return <details className="mb-6 rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">{t('Manage Categories')}</summary>
  {shop.storeMode!=='niche'&&<><p className="mt-3 text-sm text-slate-600">{t('Empty categories remain available here and are hidden from shoppers.')}</p><div className="my-3 flex flex-wrap gap-2">{rows.filter(c=>c.name!=='All').map(c=><span className="rounded-full border px-3 py-1 text-xs" key={c.name} dir="auto">{label(c.name)} ({c.count})</span>)}</div><label className="block text-sm font-semibold">{t('New Category')}<input className="mt-1 w-full rounded-lg border border-slate-300 p-2" dir="auto" maxLength={80} value={name} onChange={e=>{setName(e.target.value);setStatus('');}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/></label><button type="button" className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white" disabled={!name.trim()} onClick={add}>{t('Add Category')}</button></>}
  <div className="mt-4 border-t pt-4"><h3 className="font-semibold">{t('Export Catalog JSON')}</h3><p className="my-2 text-xs text-slate-600">{t('Export products and categories for your own defaults. Private digital delivery notes and download links are excluded.')}</p><div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg border px-4 py-2 font-semibold" onClick={copy}>{t('Copy Catalog JSON')}</button><button type="button" className="rounded-lg border px-4 py-2 font-semibold" onClick={download}>{t('Download Catalog JSON')}</button></div></div><p role="status" className="mt-2 text-sm text-emerald-800">{status&&t(status)}</p>
 </details>;
}
