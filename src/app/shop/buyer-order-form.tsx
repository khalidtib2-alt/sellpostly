'use client';
import { useState } from 'react';
import { useLanguage } from '../language-context';
import type { Message } from '../translations';
export default function BuyerOrderForm({slug,coin,network,txid,items}:{slug:string;coin:string;network:string;txid:string;items:{id:string;quantity:number}[]}){
 const {t,language}=useLanguage();
 const [phone,setPhone]=useState('');
 const [name,setName]=useState(''),[contact,setContact]=useState(''),[note,setNote]=useState(''),[orderId,setOrderId]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState<Message|''>(''),[result,setResult]=useState<{id:string;status:string;gross_amount?:string;coin?:string;network?:string;fulfillment?:{tracking:string;delivery_notes:string}}|null>(null);
 const field='mt-2 block w-full rounded-lg border border-slate-300 p-3';
 const button='rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50';
 async function send(action:'submit'|'dispute'|'confirm_receipt'|'status'){
  if(busy)return;setBusy(true);setMessage('');
  try{
   const response=await fetch(action==='submit'?'/api/orders':'/api/orders/'+encodeURIComponent(orderId.trim())+'/dispute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='submit'?{slug,coin,network,tx_id:txid,items,buyer:{name,contact,phone},language,delivery_note:note}:{contact,action,reason})});
   const data=await response.json();
   if(!response.ok){const code=data.error;setMessage(code==='STORE_SUSPENDED'?'Store Suspended for Policy Review':code==='TRANSACTION_ALREADY_SUBMITTED'?'This transaction has already been submitted. Use your existing order ID.':code==='ORDER_NOT_FOUND_OR_NOT_ELIGIBLE'?'Order not found, contact did not match, or this action is unavailable.':code==='CATALOG_CHANGED'?'The catalog changed. Refresh the shop and check the current price.':code==='INVALID_TX'?'Enter the complete transaction hash for this network.':code==='INVALID_CONTACT'?'Enter a valid email address or international phone number.':'Could not submit the request. Check your details and try again.');return;}
   setResult(data);setOrderId(data.id);setMessage(action==='submit'?'Order submitted. Keep your order ID and contact to manage delivery or disputes.':action==='dispute'?'Dispute opened. Funds remain on hold.':action==='confirm_receipt'?'Receipt confirmed. The original escrow hold still applies.':'Order status updated.');
  }catch{setMessage('Could not submit the request. Check your details and try again.');}finally{setBusy(false);}
 }
 return <section className="mt-6 border-t pt-5"><h3 className="text-lg font-bold">{t('Submit Payment / Track Order')}</h3><p className="my-3 text-sm text-slate-600">{t('Submitting a TxID records a pending order. Payment must be verified before fulfillment.')}</p>
  <form className="space-y-4" onSubmit={e=>{e.preventDefault();send('submit');}}>
   <label className="block">{t('Buyer Name')}<input required autoComplete="name" maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={field}/></label>
   <label className="block">{t('Buyer Email')}<input type="email" required autoComplete="email" dir="auto" maxLength={254} value={contact} onChange={e=>setContact(e.target.value)} className={field}/></label>
   <label className="block">{t('WhatsApp Phone (Optional)')}<input type="tel" autoComplete="tel" maxLength={30} dir="ltr" value={phone} onChange={e=>setPhone(e.target.value)} className={field}/></label>
   <label className="block">{t('Delivery City / Note')}<textarea rows={2} maxLength={400} value={note} onChange={e=>setNote(e.target.value)} className={field}/></label>
   <button disabled={busy||!txid.trim()} className={button}>{t(busy?'Saving…':'Submit Pending Order')}</button>
  </form>
  <div className="mt-6 border-t pt-5"><h4 className="font-semibold">{t('Manage an Existing Order')}</h4><label className="mt-3 block">{t('Order ID')}<input dir="ltr" maxLength={36} value={orderId} onChange={e=>setOrderId(e.target.value)} className={field}/></label><p className="mt-2 text-xs text-slate-600">{t('Use the same contact entered above. Keep your order ID private.')}</p>
   <label className="mt-3 block">{t('Dispute Reason')}<textarea maxLength={1000} rows={2} value={reason} onChange={e=>setReason(e.target.value)} className={field}/></label>
   <div className="mt-4 flex flex-wrap gap-2">{([['status','Check Order'],['confirm_receipt','Confirm Receipt'],['dispute','Open Dispute']] as const).map(([action,label])=><button type="button" key={action} disabled={busy||!orderId||!contact||(action==='dispute'&&!reason.trim())} className="rounded-lg border px-3 py-2 disabled:opacity-50" onClick={()=>send(action)}>{t(label)}</button>)}</div>
  </div>
  {result&&<div className="mt-5 rounded-lg bg-slate-50 p-4"><p className="text-xs">{t('Order ID')}</p><p dir="ltr" className="break-all font-mono text-sm">{result.id}</p><p className="mt-2">{t('Status')}: {t(result.status==='fulfilled'?'Shipped':result.status==='disputed'?'Disputed':result.status==='held'?'Held':result.status==='released'?'Released / Success':result.status==='refunded'||result.status==='cancelled'?'Failed / Refunded':'Pending')}</p>{result.fulfillment&&<div className="mt-3"><h4 className="font-semibold">{t('Delivery Details')}</h4><p className="whitespace-pre-wrap break-words">{result.fulfillment.tracking}</p><p className="whitespace-pre-wrap break-words">{result.fulfillment.delivery_notes}</p></div>}</div>}
  {message&&<p role="status" className="mt-4 rounded-lg border p-3">{t(message)}</p>}
 </section>;
}

