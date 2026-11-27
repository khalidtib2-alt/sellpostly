'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '../language-context';
import {customerTags,followUpLink,officeMoney,type BackOfficePlan,type Customer,type CustomerTag,type MoneyTotal} from './back-office-data';
import {officeMessage,officePayment,type OfficeMessage} from './back-office-messages';
import {officePost,officeRequest} from './back-office-client';
import ManualReceipt from './manual-receipt';
import type {analyticsReport} from '../../lib/back-office-report';

type Data={plan:BackOfficePlan;shops:{id:string;name:string}[];shopId?:string;customers?:Customer[];
 hasMore?:boolean;report?:ReturnType<typeof analyticsReport>;receipts?:{id:string;invoice_number:string}[]};
const control='rounded-lg border border-slate-300 px-3 py-2';
type View='customers'|'analytics';
const exportLabels={orders:'exportOrders',revenue:'exportRevenue',customers:'exportCustomers'} as const;

export default function BackOfficeDashboard({view}:{view:View}){
 const {language,t}=useLanguage(),tr=(key:OfficeMessage)=>officeMessage(language,key);
 const [data,setData]=useState<Data>(),[shopId,setShopId]=useState(''),[period,setPeriod]=useState('30');
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[search,setSearch]=useState(''),[offset,setOffset]=useState(0),[revision,refresh]=useState(0);
 const [loading,setLoading]=useState(true),[error,setError]=useState<OfficeMessage>(),[exporting,setExporting]=useState(false);
 const [manual,setManual]=useState(false),[editing,setEditing]=useState<Customer>(),[tags,setTags]=useState<CustomerTag[]>([]),[note,setNote]=useState('');
 const [saving,setSaving]=useState(false),[editError,setEditError]=useState(false);
 const editDialog=useRef<HTMLDialogElement>(null);
 const params=new URLSearchParams({view,period,from,to,search,offset:String(offset),...(shopId?{shopId}:{})});
 const query=params.toString(),validRange=period!=='custom'||view==='customers'||!!from&&!!to&&from<=to;
 useEffect(()=>{
  if(!validRange){setLoading(false);setError('invalidRange');return;}
  const controller=new AbortController();
  setLoading(true);setError(undefined);
  const timer=setTimeout(()=>{
   officeRequest(new URLSearchParams(query),{signal:controller.signal}).then(r=>r.json()).then(setData)
    .catch(error=>{if(!controller.signal.aborted)setError(error.message==='AUTH_REQUIRED'?'signIn':error.message==='INVALID_RANGE'?'invalidRange':'failed');})
    .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  },150);
  return ()=>{clearTimeout(timer);controller.abort();};
 },[query,revision,validRange]);
 const number=new Intl.NumberFormat(language),date=new Intl.DateTimeFormat(language,{dateStyle:'medium'});
 const money=(values:MoneyTotal[])=>values.length?values.map(row=>officeMoney(language,row.amount,row.currency)).join(' · '):'—';
 const report=data?.report,customers=data?.customers||[];
 async function download(kind:keyof typeof exportLabels){
  setExporting(true);setError(undefined);
  try{
   const params=new URLSearchParams(query);params.set('export',kind);
   const response=await officeRequest(params),url=URL.createObjectURL(await response.blob()),anchor=document.createElement('a');
   anchor.href=url;anchor.download='sellpostly-'+kind+'.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setError('failed');}finally{setExporting(false);}
 }
 return <main className="mx-auto max-w-7xl space-y-5 px-5 py-9">
  <h1 className="text-3xl font-black">{tr(view==='customers'?'customers':'analytics')}</h1>
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid gap-1 text-sm">{t('Active Shop')}<select className={control} value={shopId||data?.shopId||''} onChange={e=>{setShopId(e.target.value);setOffset(0);}}>
    {!data?.shops.length&&<option value="">—</option>}
    {data?.shops.map(shop=><option key={shop.id} value={shop.id}>{shop.name||t('My Shop')}</option>)}
    {data?.plan==='b2b'&&<option value="all">{tr('allShops')}</option>}
   </select></label>
   {view==='customers'?<label className="grid flex-1 gap-1 text-sm">{tr('search')}<input className={control} value={search} maxLength={120} onChange={e=>{setSearch(e.target.value);setOffset(0);}}/></label>
    :<><label className="grid gap-1 text-sm">{tr('range')}<select className={control} value={period} onChange={e=>setPeriod(e.target.value)}>
     {(['7','30','90','custom'] as const).map(value=><option key={value} value={value}>{tr(value==='custom'?'custom':`days${value}`)}</option>)}
    </select></label>{period==='custom'&&<>
     <label className="grid gap-1 text-sm">{tr('from')}<input type="date" className={control} value={from} onChange={e=>setFrom(e.target.value)}/></label>
     <label className="grid gap-1 text-sm">{tr('to')}<input type="date" className={control} value={to} onChange={e=>setTo(e.target.value)}/></label>
    </>}</>}
   {data?.shopId&&shopId!=='all'&&<button type="button" disabled={loading} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={()=>setManual(true)}>{tr('create')}</button>}
  </div>
  {loading&&<p role="status">{tr('loading')}</p>}
  {error&&<p role="alert" className="text-red-700">{error==='signIn'?<a className="underline" href="/shop">{tr(error)}</a>:tr(error)}</p>}
  {data&&!loading&&!data.shops.length&&<p>{tr('noShop')}</p>}
  {data&&!!data.shops.length&&!loading&&view==='customers'&&<>
   {customers.length?<div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[57rem] text-sm">
    <thead><tr>{(['name','phone','email','city','count','spent','last','preferred','tags'] as const).map(key=><th key={key} scope="col" className="bg-slate-50 p-3 text-start">{tr(key)}</th>)}</tr></thead>
    <tbody>{customers.map(customer=>{
     const follow=followUpLink(customer.phone,customer.name,language);
     return <tr key={customer.key} className="border-t align-top">
      <td className="p-3"><strong dir="auto">{customer.name||'—'}</strong>{shopId==='all'&&<small className="block">{customer.shopName}</small>}
       <button type="button" className="mt-1 block text-start underline" onClick={()=>{setEditing(customer);setTags(customer.tags);setNote(customer.note);setEditError(false);editDialog.current?.showModal();}}>{tr('edit')}</button>
      </td><td className="p-3" dir="ltr">{customer.phone||'—'}{follow&&<a href={follow} target="_blank" rel="noopener noreferrer" className="block underline" dir="auto">{tr('follow')}</a>}</td>
      <td className="p-3" dir="auto">{customer.email||'—'}</td><td className="p-3" dir="auto">{customer.city||'—'}</td>
      <td className="p-3">{number.format(customer.orders)}</td><td className="p-3">{money(customer.spent)}</td>
      <td className="p-3"><a className="underline" href={'/dashboard/invoice/'+customer.lastOrderId}>{date.format(new Date(customer.lastOrder))}</a></td><td className="p-3">{tr(customer.preferred)}</td>
      <td className="p-3">{customer.tags.map(tr).join(' · ')||'—'}</td>
     </tr>;
    })}</tbody>
   </table></div>:<p>{tr('noCustomers')}</p>}
   <div className="flex gap-2">{offset>0&&<button type="button" onClick={()=>setOffset(offset-50)} className={control}>{tr('previous')}</button>}
    {data.hasMore&&<button type="button" onClick={()=>setOffset(offset+50)} className={control}>{tr('next')}</button>}</div>
   {!!data.receipts?.length&&<section className="rounded-xl border p-4"><h2 className="mb-2 font-bold">{tr('receipt')}</h2>
    <ul className="flex flex-wrap gap-3">{data.receipts.map(receipt=><li key={receipt.id}><a className="underline" href={'/dashboard/invoice/'+receipt.id} dir="ltr">{receipt.invoice_number}</a></li>)}</ul>
   </section>}
  </>}
  {report&&!loading&&view==='analytics'&&<>
   {!report.sales&&<p>{tr('noSales')}</p>}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {([['revenue',money(report.revenue)],['delivered',number.format(report.delivered)],['pending',number.format(report.pending)],['pendingCod',number.format(report.pendingCod)],
      ['average',money(report.average)],['conversion',report.conversion===null?tr('noSessions'):new Intl.NumberFormat(language,{style:'percent',maximumFractionDigits:2}).format(report.conversion)]] as const)
     .map(([label,value])=><section key={label} className="rounded-xl border bg-white p-4"><h2 className="text-sm font-semibold">{tr(label)}</h2><p className="mt-1 text-xl font-bold">{value}</p>
      {label==='conversion'&&<p className="mt-1 text-sm text-slate-600">{tr('conversionHint')}</p>}</section>)}
   </div>
   <div className="grid gap-4 md:grid-cols-2">
    <section className="rounded-xl border p-4"><h2 className="font-bold">{tr('top')}</h2><ul className="divide-y">
     {report.products.map((row,index)=><li key={index} className="flex justify-between gap-2 py-2"><span dir="auto">{row.name} {row.variant}{shopId==='all'&&<small className="block">{row.shop}</small>}</span><b>{number.format(row.quantity)}</b></li>)}
    </ul>{!report.products.length&&<p className="mt-2">{tr('noSales')}</p>}</section>
    <section className="rounded-xl border p-4"><h2 className="font-bold">{tr('revenueMethod')}</h2><ul className="divide-y">
     {report.methods.map(row=><li key={row.method+row.currency} className="flex justify-between gap-2 py-2"><span>{officePayment(language,row.method)}</span><b>{money([row])}</b></li>)}
    </ul>{!report.methods.length&&<p className="mt-2">{tr('noSales')}</p>}</section>
   </div>
  </>}
  {data&&<section className="flex flex-wrap gap-3 rounded-xl border p-4">
   {data.plan==='free'?<><p>{tr('upgrade')}</p><a href="/pricing" className="font-semibold underline">{tr('plans')}</a></>
    :(view==='customers'?['customers'] as const:['orders','revenue','customers'] as const).map(kind=>
     <button key={kind} type="button" disabled={loading||exporting||!validRange||!data.shops.length} className={control+' disabled:opacity-50'} onClick={()=>void download(kind)}>{tr(exportLabels[kind])}</button>)}
  </section>}
  <dialog ref={editDialog} onCancel={e=>{if(saving)e.preventDefault();}} aria-labelledby="customer-edit-title" className="m-auto w-[min(94vw,34rem)] rounded-xl border bg-white p-5 text-slate-900 backdrop:bg-black/50">
   {editing&&<form className="space-y-4" onSubmit={async e=>{
    e.preventDefault();if(saving)return;setSaving(true);setEditError(false);
    try{await officePost({action:'customerProfile',shopId:editing.shopId,key:editing.key,tags,note});editDialog.current?.close();refresh(value=>value+1);}
    catch{setEditError(true);}finally{setSaving(false);}
   }}>
    <h2 id="customer-edit-title" className="text-xl font-bold">{tr('edit')}</h2>
    <fieldset className="space-y-2"><legend>{tr('tags')}</legend>{customerTags.map(tag=><label key={tag} className="flex items-center gap-2">
     <input type="checkbox" checked={tags.includes(tag)} onChange={e=>setTags(previous=>e.target.checked?[...previous,tag]:previous.filter(value=>value!==tag))}/>{tr(tag)}
    </label>)}</fieldset>
    <label className="grid gap-1">{tr('note')}<textarea value={note} rows={4} maxLength={2000} onChange={e=>setNote(e.target.value)} className={control}/></label>
    {editError&&<p role="alert">{tr('failed')}</p>}
    <div className="flex gap-2"><button disabled={saving} className={control}>{tr(saving?'loading':'save')}</button>
     <button type="button" disabled={saving} className={control} onClick={()=>editDialog.current?.close()}>{t('Close')}</button></div>
   </form>}
  </dialog>
  {manual&&data?.shopId&&<ManualReceipt shopId={data.shopId} onClose={()=>setManual(false)} onSaved={id=>location.assign('/dashboard/invoice/'+id)}/>}
 </main>;
}
