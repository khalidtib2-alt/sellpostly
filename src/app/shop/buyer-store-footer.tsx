'use client';
import { useRef,useState } from 'react';
import { useLanguage } from '../language-context';
import type { Message } from '../translations';
export default function BuyerStoreFooter({storeSlug}:{storeSlug?:string}){
 const {t}=useLanguage();
 const dialog=useRef<HTMLDialogElement>(null);
 const [orderId,setOrderId]=useState(''),[contact,setContact]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[message,setMessage]=useState<Message|''>('');
 const field='mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm';
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy||sent)return;setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/orders/'+encodeURIComponent(orderId.trim())+'/dispute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'dispute',contact:contact.trim(),reason:reason.trim(),...(storeSlug?{storeSlug}:{})})});
   const result=await response.json();
   if(!response.ok){setMessage(result.error==='ORDER_NOT_FOUND_OR_NOT_ELIGIBLE'?'Order not found, contact did not match, or this order cannot be disputed.':result.error==='INVALID_CONTACT'?'Enter a valid email address or international phone number.':result.error==='INVALID_INPUT'?'Check your order ID, contact and dispute reason.':'Could not submit the dispute. Check your connection and try again.');return;}
   setSent(true);setMessage('Your dispute has been sent to the Admin for review. Keep your order ID for follow-up.');
  }catch{setMessage('Could not submit the dispute. Check your connection and try again.');}finally{setBusy(false);}
 }
 return <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
  <p className="text-xs font-medium text-slate-600">{t('Powered by SellPostly')}</p>
  <button type="button" onClick={()=>{setMessage('');setSent(false);dialog.current?.showModal();}} className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">{t('Dispute Order / Report Store')}</button>
  <dialog ref={dialog} aria-labelledby="buyer-dispute-title" className="m-auto max-h-[90dvh] w-[min(95vw,30rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-start text-slate-900 backdrop:bg-black/50">
   <div className="flex items-center justify-between gap-4"><h2 id="buyer-dispute-title" className="text-xl font-bold">{t('Dispute Order')}</h2><button type="button" disabled={busy} onClick={()=>dialog.current?.close()}>{t('Close')}</button></div>
   <p className="mt-4 text-sm text-slate-600">{t('Send an order dispute or order-related store report directly to the Admin using your order ID and original contact.')}</p>
   <form className="mt-5 space-y-4" onSubmit={submit}>
    <label className="block text-sm font-semibold">{t('Order ID')}<input required autoFocus dir="ltr" maxLength={36} disabled={busy||sent} value={orderId} onChange={e=>setOrderId(e.target.value)} className={field}/></label>
    <label className="block text-sm font-semibold">{t('Matching Contact Information')}<input required dir="auto" autoComplete="email" maxLength={254} disabled={busy||sent} value={contact} onChange={e=>setContact(e.target.value)} className={field} placeholder={t('Email or international phone used for this order')}/></label>
    <label className="block text-sm font-semibold">{t('Dispute Reason')}<textarea required dir="auto" rows={4} maxLength={1000} disabled={busy||sent} value={reason} onChange={e=>setReason(e.target.value)} className={field}/></label>
    <p className="text-xs text-slate-600">{t('Only held orders with matching contact information can open a dispute. Your message goes to the Admin for review.')}</p>
    <button disabled={busy||sent||!orderId.trim()||!contact.trim()||!reason.trim()} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{t(busy?'Sending Dispute…':sent?'Dispute Submitted':'Send Dispute to Admin')}</button>
   </form>
   {message&&<p role="status" className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{t(message)}</p>}
  </dialog>
 </footer>;
}

