'use client';
import {useEffect,useRef,useState} from 'react';
import QRCode from 'qrcode';
import {useLanguage} from '../language-context';
import {escrowReady,escrowWallet} from './escrow-config';
const storage='sellpostly-pro-upgrade-receipt';
const monthly=process.env.NEXT_PUBLIC_PRO_PRICE_USD||'15';
const lifetime=process.env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD||'';
type Receipt={email:string;tx_id:string;receipt_token:string};
type Status={status:string;issued_license_key?:string;amount_usd?:string};
export default function ProCryptoUpgrade({onActivate}:{onActivate:(key:string)=>Promise<void>}){
 const {t,language}=useLanguage(),canvas=useRef<HTMLCanvasElement>(null);
 const [email,setEmail]=useState(''),[tx,setTx]=useState(''),[coin,setCoin]=useState('USDC'),[plan,setPlan]=useState('monthly');
 const [receipt,setReceipt]=useState<Receipt|null>(null),[status,setStatus]=useState<Status|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[copied,setCopied]=useState(false),[duplicate,setDuplicate]=useState(false);
 const amount=plan==='lifetime'?lifetime:monthly;
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved&&typeof saved.email==='string'&&/^0x[0-9a-f]{64}$/.test(saved.tx_id)&&/^[a-f0-9]{64}$/.test(saved.receipt_token))setReceipt(saved);}catch{}},[]);
 useEffect(()=>{let active=true;if(escrowReady){const temp=document.createElement('canvas');QRCode.toCanvas(temp,escrowWallet,{width:192,margin:4}).then(()=>{if(active&&canvas.current){canvas.current.width=192;canvas.current.height=192;canvas.current.getContext('2d')?.drawImage(temp,0,0);}}).catch(()=>{});}return()=>{active=false;};},[receipt]);
 async function check(saved:Receipt){
  const response=await fetch('/api/pro/request?'+new URLSearchParams({tx_id:saved.tx_id,email:saved.email}),{headers:{'x-upgrade-token':saved.receipt_token},cache:'no-store'});
  if(!response.ok)throw Error();return await response.json() as Status;
 }
 useEffect(()=>{if(!receipt)return;let active=true;async function poll(){if(document.hidden)return;try{const value=await check(receipt!);if(active){setStatus(value);setError(false);}}catch{if(active)setError(true);}}void poll();const timer=window.setInterval(()=>{void poll();},15000);return()=>{active=false;clearInterval(timer);};},[receipt]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError(false);setDuplicate(false);
  try{const response=await fetch('/api/pro/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,plan,coin,language,network:'Polygon',tx_id:tx.trim()}),cache:'no-store'});if(!response.ok){if(response.status===409)setDuplicate(true);throw Error();}const value=await response.json();const saved={email:email.trim().toLowerCase(),tx_id:value.tx_id,receipt_token:value.receipt_token};setReceipt(saved);setStatus(value);try{localStorage.setItem(storage,JSON.stringify(saved));}catch{}}catch{setError(true);}finally{setBusy(false);}
 }
 const field='mt-1 w-full rounded-lg border border-slate-300 bg-white p-2';
 return <section className="mt-6 border-t border-slate-200 pt-5">
 <h3 className="text-lg font-bold">{t('Pay with USDC / USDT (Polygon)')}</h3>
 <p className="my-2 text-sm text-slate-600">{t('Admin verifies your payment before issuing a Pro key. Monthly access lasts 30 days from approval.')}</p>
 {!escrowReady?<p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">{t('Pro crypto checkout is unavailable. Use an existing license key or contact support.')}</p>:<>
 {!receipt&&<form onSubmit={submit} className="space-y-3">
 <label className="block">{t('Subscription Plan')}<select className={field} value={plan} onChange={e=>setPlan(e.target.value)}><option value="monthly">{t('Monthly')} — {monthly} USD</option>{lifetime&&<option value="lifetime">{t('Lifetime')} — {lifetime} USD</option>}</select></label>
 <div className="flex flex-wrap items-center gap-4"><canvas ref={canvas} role="img" aria-label={t('Polygon payment address QR code')} className="h-40 w-40 bg-white"/><div><p className="font-bold" dir="ltr">{amount} {coin} · Polygon</p><label className="block">{t('Coin')}<select value={coin} onChange={e=>setCoin(e.target.value)} className={field}><option>USDC</option><option>USDT</option></select></label></div></div>
 <p className="text-sm">{t('Send only USDC or USDT on Polygon to this address. The QR contains the address only; enter the amount and network in your wallet.')}</p>
 <code dir="ltr" className="block break-all rounded-lg bg-slate-100 p-3 text-xs">{escrowWallet}</code>
 <button type="button" className="text-sm font-semibold underline" onClick={async()=>{try{await navigator.clipboard.writeText(escrowWallet);setCopied(true);}catch{setError(true);}}}>{t(copied?'Copied!':'Copy Address')}</button>
 <label className="block">{t('Email')}<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className={field}/></label>
 <label className="block">{t('Transaction Hash (TxID)')}<input required pattern="0x[a-fA-F0-9]{64}" maxLength={66} dir="ltr" value={tx} onChange={e=>setTx(e.target.value)} className={field}/></label>
 <button disabled={busy} className="w-full rounded-lg bg-emerald-700 p-3 font-semibold text-white disabled:opacity-50">{t('Submit Payment for Review')}</button></form>}
 {receipt&&<div className="space-y-3 rounded-xl bg-slate-50 p-4" aria-live="polite"><p className="font-bold">{t(status?.status==='approved'?'Approved':status?.status==='rejected'?'Rejected':'Pending')}</p><p className="break-all text-xs" dir="ltr">{receipt.tx_id}</p><p className="text-sm">{t('Keep this browser data to check your request securely. A public transaction hash alone cannot reveal a license key.')}</p><button disabled={busy} className="font-semibold underline" onClick={async()=>{setBusy(true);try{setStatus(await check(receipt));setError(false);}catch{setError(true);}finally{setBusy(false);}}}>{t('Check Payment Status')}</button>
 {status?.status==='approved'&&status.issued_license_key&&<><code dir="ltr" className="block break-all rounded-lg border bg-white p-3">{status.issued_license_key}</code><button disabled={busy} className="rounded-lg bg-emerald-700 p-3 font-bold text-white" onClick={async()=>{setBusy(true);try{await onActivate(status.issued_license_key!);}catch{setError(true);}finally{setBusy(false);}}}>{t('Activate Issued Pro Key')}</button></>}
 {status?.status==='rejected'&&<p>{t('Payment was rejected. Contact support before sending another payment.')}</p>}
 <button className="block text-xs underline" onClick={()=>{setReceipt(null);setStatus(null);setError(false);try{localStorage.removeItem(storage);}catch{}}}>{t('Submit Another Transaction')}</button></div>}
 </>}
 {error&&<p role="alert" className="mt-3 text-sm text-red-700">{t(duplicate?'This transaction was already submitted. Check its status using the original browser or contact support.':'Could not submit or check payment. Check your connection and try again.')}</p>}
 <a className="mt-3 block text-sm underline" href="mailto:support@sellpostly.com">support@sellpostly.com</a>
 </section>;
}

