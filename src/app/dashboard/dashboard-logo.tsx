'use client';
import {useEffect,useState} from 'react';
import type {Shop} from '../shop/shop-data';
import ShopLogoEditor from '../shop/shop-logo-editor';
import {shopHeaders} from '../shop/multi-shop-data';
import {mergeLogoDraft} from '../shop/logo-drafts';
import {useLanguage} from '../language-context';
export default function DashboardLogo({shop,onSaved}:{shop:Shop;onSaved:(logo:string)=>void}){
 const {t}=useLanguage(),[logo,setLogo]=useState(shop.logo||''),[busy,setBusy]=useState(false),[message,setMessage]=useState<'saved'|'error'|''>('');
 useEffect(()=>{setLogo(shop.logo||'');},[shop.shopId,shop.logo]);
 useEffect(()=>setMessage(''),[shop.shopId]);
 async function save(value:string){if(busy)return;setBusy(true);setMessage('');try{const response=await fetch('/api/shops/logo',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify({shopId:shop.shopId,shopMode:shop.shopMode,logo:value})});if(!response.ok)throw Error();mergeLogoDraft(shop,value,localStorage);onSaved(value);setMessage('saved');}catch{setMessage('error');}finally{setBusy(false);}}
 return <section className="mb-6 rounded-2xl border bg-white p-5"><ShopLogoEditor value={logo} name={shop.name} onChange={value=>{setLogo(value);setMessage('');}} onSave={value=>void save(value)} disabled={busy}/><p role="status" className="mt-3 text-sm">{message&&t(message==='saved'?'Shop logo saved.':'Could not save store settings. Try again.')}</p><a href="/shop" className="mt-3 inline-block font-semibold underline">{t('My Shop')}</a></section>;
}
