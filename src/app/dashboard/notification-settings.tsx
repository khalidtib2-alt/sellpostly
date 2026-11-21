'use client';
import {shopHeaders} from '../shop/multi-shop-data';
import {useEffect,useState} from 'react';
import {useLanguage} from '../language-context';
export default function NotificationSettings(){
 const {t,language}=useLanguage(),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState<'saved'|'error'|''>('');
 useEffect(()=>{let active=true;fetch('/api/seller/notifications',{headers:shopHeaders(localStorage),cache:'no-store'}).then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(active)setEmail(data.email||'');}).catch(()=>{if(active)setStatus('error');});return()=>{active=false;};},[]);
 return <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setStatus('');try{const response=await fetch('/api/seller/notifications',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify({email,language})});if(!response.ok)throw Error();setStatus('saved');}catch{setStatus('error');}finally{setBusy(false);}}}><label className="block text-sm font-semibold">{t('Seller Notification Email')}<input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full max-w-md rounded-lg border p-2" dir="ltr"/></label><p className="my-2 text-xs text-slate-600">{t('Payout updates use this private email and your current language. Leave blank to disable seller emails.')}</p><button disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Save Email Preferences')}</button>{status&&<p role="status" className="mt-2 text-sm">{t(status==='saved'?'Email preferences saved.':'Could not load or save email preferences.')}</p>}</form>;
}

