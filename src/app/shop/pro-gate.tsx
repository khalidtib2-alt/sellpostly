'use client';
import {shopHeaders} from './multi-shop-data';
import {demoProducts} from './demo-products';
import dynamic from 'next/dynamic';
import ProCryptoUpgrade from './pro-crypto-upgrade';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../language-context';
const ShopBuilder=dynamic(()=>import('./shop-builder'));
export const proStorageKey='sellpostly-pro-key';
export default function ProGate({children,workspace='products'}:{children?:React.ReactNode;workspace?:'products'|'settings'}){
  const {t}=useLanguage();
  const [verified,setVerified]=useState(false),[checking,setChecking]=useState(true),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(false);
  const [free,setFree]=useState(false);
  const [upgradeRequested,setUpgradeRequested]=useState(false);
  const [upgradePlan,setUpgradePlan]=useState<'monthly'|'b2b'>('monthly');
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const plan=new URLSearchParams(location.search).get('upgrade');setUpgradeRequested(plan==='pro'||plan==='b2b');if(plan==='b2b')setUpgradePlan('b2b');},[]);
  useEffect(()=>{if(checking||!upgradeRequested)return;if(!verified)dialog.current?.showModal();else if(upgradePlan==='b2b')dialog.current?.showModal();const url=new URL(location.href);url.searchParams.delete('upgrade');history.replaceState(history.state,'',url.pathname+url.search+url.hash);},[checking,verified,upgradeRequested,upgradePlan]);
  useEffect(()=>{
    let active=true;
    async function check(){
      try{
        const saved=localStorage.getItem(proStorageKey);
        if(saved){const response=await fetch('/api/pro/verify',{method:'POST',headers:{'x-pro-key':saved,'x-shop-key':localStorage.getItem('sellpostly-free-shop-key')||''},cache:'no-store'});if(active)setVerified(response.ok);if(!response.ok&&!children){const shop=await fetch('/api/shops',{headers:{'x-pro-key':saved,'x-shop-key':localStorage.getItem('sellpostly-free-shop-key')||''},cache:'no-store'});if(active&&shop.ok)setFree(true);}}
      }catch{}finally{try{if(localStorage.getItem('sellpostly-free-shop-key')){const r=await fetch('/api/shops',{headers:{'x-shop-key':localStorage.getItem('sellpostly-free-shop-key')||''},cache:'no-store'});if(active&&r.ok){const account=await r.json();if(account.tier==='pro')setVerified(true);else if(!children)setFree(true);}}}catch{}if(active)setChecking(false);}
    }
    check();return()=>{active=false;};
  },[]);
  async function activateIssued(issued:string){
    const response=await fetch('/api/pro/verify',{method:'POST',headers:{...shopHeaders(localStorage),'x-pro-key':issued},cache:'no-store'});
    if(!response.ok)throw Error();
    localStorage.setItem(proStorageKey,issued);setVerified(true);dialog.current?.close();
  }
  async function activate(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError(false);
    try{
      const response=await fetch('/api/pro/verify',{method:'POST',headers:{...shopHeaders(localStorage),'x-pro-key':key.trim()},cache:'no-store'});
      if(!response.ok)throw Error();
      localStorage.setItem(proStorageKey,key.trim());setVerified(true);dialog.current?.close();
    }catch{setError(true);}finally{setBusy(false);}
  }
  async function startFree(){setBusy(true);setError(false);try{const r=await fetch('/api/shop/account',{method:'POST'});const value=await r.json();if(!r.ok||!value.key)throw Error();localStorage.setItem('sellpostly-free-shop-key',value.key);setFree(true);}catch{setError(true);}finally{setBusy(false);}}
  if(free&&!verified&&!children&&!upgradeRequested)return <><div className="mx-auto flex max-w-7xl justify-between gap-4 px-5 pt-5"><p>{t('Free Primary Stores')}</p><button className="font-semibold underline" onClick={()=>{setFree(false);setTimeout(()=>dialog.current?.showModal(),0);}}>{t('Activate Pro License')}</button></div><ShopBuilder workspace={workspace}/></>;
  if(verified&&!upgradeRequested)return <><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 pt-5"><nav aria-label="SellPostly Pro" className="flex gap-5 font-semibold"><a className="text-emerald-800 underline" href="/shop">{t("My Shop")}</a><a className="text-emerald-800 underline" href="/settings">{t("Seller Settings")}</a><a className="text-emerald-800 underline" href="/studio">{t("Creator Studio")}</a><a className="text-emerald-800 underline" href="/dashboard">{t("Seller Dashboard")}</a></nav><button className="text-sm underline" onClick={()=>{localStorage.removeItem(proStorageKey);setVerified(false);setKey('');}}>{t('Deactivate Pro on this device')}</button></div>{children||<ShopBuilder workspace={workspace}/>}</>;
  return <main className="mx-auto max-w-6xl px-5 py-16">
    <section className="grid items-center gap-10 lg:grid-cols-2">
      <div><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">SellPostly Pro</span><h1 className="mt-5 text-4xl font-black sm:text-5xl">{t('SellPostly Pro Storefront')}</h1><p className="mt-5 text-lg text-slate-600">{t('Your brand. Your catalog. A storefront built to sell.')}</p><ul className="my-6 space-y-3">{(['Branded storefront and public shop link','Affiliate deals or personal seller cart','Store logo and configurable escrow hold'] as const).map(text=><li key={text}>✓ {t(text)}</li>)}</ul><button disabled={checking} onClick={()=>dialog.current?.showModal()} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50">{t(checking?'Checking license…':'Activate Pro License')}</button>{!children&&<button type="button" disabled={busy||checking} className="ms-3 rounded-xl border px-6 py-3 font-bold" onClick={()=>void startFree()}>{t('Start Free Primary Stores')}</button>}<p className="mt-4 text-sm text-slate-600">{t('The social formatter stays free. Buyers never need a license.')}</p></div>
      <div aria-label={t('Storefront Preview')} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xl"><div className="flex items-center gap-3 border-b pb-5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 font-black text-white">SP</span><div><h2 className="text-xl font-bold">{t('Your Store Name')}</h2><p className="text-sm text-slate-600">{t('A curated collection, made yours.')}</p></div></div><p className="my-4 text-xs font-semibold uppercase text-emerald-800">{t('Preview only')}</p><div className="grid grid-cols-2 gap-4">{demoProducts.map(product=><article key={product.category} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"><div className="aspect-[3/4] overflow-hidden rounded-xl bg-slate-200"><img src={product.image} alt={t(product.name)} width={480} height={360} className="h-full w-full object-cover object-top transition-transform duration-300 motion-safe:group-hover:scale-105" decoding="async"/></div><p className="mt-3 text-sm font-semibold">{t(product.category)}</p><p className="mt-1 text-base font-extrabold text-slate-900" dir="ltr">{product.price}</p></article>)}</div></div>
    </section>
    <dialog ref={dialog} onClose={()=>setUpgradeRequested(false)} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} aria-labelledby="pro-title" className="m-auto max-h-[90vh] overflow-y-auto w-[min(94vw,36rem)] rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/50"><div className="flex items-center justify-between gap-3"><h2 id="pro-title" className="text-xl font-bold">{t('Activate Pro License')}</h2><button onClick={()=>dialog.current?.close()}>{t('Close')}</button></div><form onSubmit={activate} className="mt-5"><label className="block font-semibold">{t('Pro License Key')}<input autoFocus required type="password" autoComplete="off" maxLength={256} dir="ltr" value={key} onChange={e=>setKey(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3"/></label><p className="my-3 text-sm text-slate-600">{t('Your key is verified securely and saved only on this device.')}</p><button disabled={busy} className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{t(busy?'Checking license…':'Activate Pro License')}</button>{error&&<p role="alert" className="mt-3 text-red-700">{t('License could not be activated. Check your key and try again.')}</p>}</form><ProCryptoUpgrade initialPlan={upgradePlan} onActivate={activateIssued}/></dialog>
  </main>;
}
