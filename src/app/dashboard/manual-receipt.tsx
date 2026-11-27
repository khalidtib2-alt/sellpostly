'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '../language-context';
import {variantLabel,type StockVariant} from '../shop/inventory-data';
import {officeMessage,officePayment,type OfficeMessage} from './back-office-messages';
import {officePost,officeRequest} from './back-office-client';

type ProductChoice={id:string;name:string;price:string;variants?:StockVariant[];stock?:number};
type Line={key:string;id:string;variantId:string;quantity:number;unitPrice:string};
const control='mt-1 block w-full rounded-lg border border-slate-300 p-2';
const emptyLine=():Line=>({key:crypto.randomUUID(),id:'',variantId:'',quantity:1,unitPrice:''});

export default function ManualReceipt({shopId,onClose,onSaved}:{shopId:string;onClose:()=>void;onSaved:(id:string)=>void}){
 const {language,t}=useLanguage(),tr=(key:OfficeMessage)=>officeMessage(language,key);
 const dialog=useRef<HTMLDialogElement>(null),requestId=useRef('');
 const [products,setProducts]=useState<ProductChoice[]>([]),[lines,setLines]=useState<Line[]>(()=>[emptyLine()]);
 const [method,setMethod]=useState('CASH'),[paid,setPaid]=useState(true),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<OfficeMessage>();
 useEffect(()=>{
  dialog.current?.showModal();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  officeRequest(new URLSearchParams({catalog:shopId}),{signal:controller.signal}).then(r=>r.json())
   .then(data=>setProducts(data.products)).catch(()=>{if(!controller.signal.aborted)setError('failed');})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[shopId]);
 const change=(key:string,value:Partial<Line>)=>setLines(previous=>previous.map(line=>line.key===key?{...line,...value}:line));
 return <dialog ref={dialog} onClose={onClose} onCancel={e=>{if(busy)e.preventDefault();}} aria-labelledby="manual-receipt-title" className="m-auto max-h-[90vh] w-[min(94vw,56rem)] overflow-y-auto rounded-2xl border bg-white p-5 text-slate-900 backdrop:bg-black/50">
  <header className="mb-4 flex items-center justify-between gap-3"><h2 id="manual-receipt-title" className="text-xl font-bold">{tr('create')}</h2>
   <button type="button" disabled={busy} onClick={()=>dialog.current?.close()}>{t('Close')}</button></header>
  {loading&&<p role="status">{tr('loading')}</p>}
  <form className="space-y-4" onSubmit={async e=>{
   e.preventDefault();if(busy)return;
   const form=new FormData(e.currentTarget),get=(key:string)=>String(form.get(key)||'');
   setBusy(true);setError(undefined);requestId.current ||= crypto.randomUUID();
   try{
    const response=await officePost({action:'manualReceipt',shopId,requestId:requestId.current,method,paid,currency:get('currency'),channel:get('channel'),
     shipping:get('shipping'),discount:get('discount'),
     buyer:{name:get('name'),phone:get('phone'),email:get('email'),city:get('city'),address:get('address')},
     items:lines.map(({key,...line})=>({...line,variantId:line.variantId||undefined}))});
    const result=await response.json();onSaved(result.id);
   }catch(error){
    const code=error instanceof Error?error.message:'';
    setError(['OUT_OF_STOCK','INVALID_VARIANT','CATALOG_CHANGED'].includes(code)?'stockError':code==='INVALID_CONTACT'?'contactError':'receiptError');
   }finally{setBusy(false);}
  }}>
   <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
    {(['name','phone','email','city','address'] as const).map(key=><label key={key}>{tr(key)}
     <input name={key} maxLength={key==='address'?400:key==='email'?254:key==='phone'?32:100} required={key==='name'} type={key==='email'?'email':key==='phone'?'tel':'text'} className={control} dir="auto"/>
    </label>)}
   </fieldset>
   <fieldset disabled={busy||loading} className="space-y-3">
    {lines.map(line=>{
     const selected=products.find(product=>product.id===line.id),variant=selected?.variants?.find(option=>option.id===line.variantId);
     const available=variant?.stockCount??selected?.stock;
     return <div key={line.key} className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr_auto]">
      <label>{tr('product')}<select required className={control} value={line.id} onChange={e=>{
       const choice=products.find(product=>product.id===e.target.value);
       const price=choice?.price.match(/\d+(?:\.\d+)?/)?.[0]||'';
       change(line.key,{id:e.target.value,variantId:'',unitPrice:price,quantity:1});
      }}><option value="">{tr('select')}</option>{products.map(product=><option key={product.id} value={product.id} disabled={product.stock===0}>{product.name}</option>)}</select></label>
      <label>{tr('variant')}<select disabled={!selected?.variants?.length} required={!!selected?.variants?.length} className={control} value={line.variantId} onChange={e=>change(line.key,{variantId:e.target.value,quantity:1})}>
       <option value="">{selected?.variants?.length?tr('select'):'—'}</option>{selected?.variants?.map(row=><option key={row.id} value={row.id} disabled={!row.stockCount}>{variantLabel(row)} ({row.stockCount})</option>)}
      </select></label>
      <label>{tr('quantity')}<input type="number" required min={1} max={Math.min(99,available??99)} className={control} value={line.quantity||''} onChange={e=>change(line.key,{quantity:Number(e.target.value)})}/></label>
      <label>{tr('price')}<input type="text" inputMode="decimal" required pattern="[0-9]{1,14}(\.[0-9]{1,6})?" className={control} value={line.unitPrice} onChange={e=>change(line.key,{unitPrice:e.target.value.replace(',','.')})}/></label>
      <button type="button" disabled={lines.length===1} className="rounded-lg border p-2 disabled:opacity-50" onClick={()=>setLines(previous=>previous.filter(row=>row.key!==line.key))}>{tr('remove')}</button>
     </div>;
    })}
    <button type="button" disabled={lines.length>=50} className="rounded-lg border px-3 py-2" onClick={()=>setLines(previous=>[...previous,emptyLine()])}>{tr('add')}</button>
   </fieldset>
   <fieldset disabled={busy} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <label>{tr('channel')}<select name="channel" className={control}>{(['whatsapp','instagram','inPerson','other'] as const).map(channel=><option key={channel} value={channel}>{tr(channel)}</option>)}</select></label>
    <label>{tr('currency')}<select name="currency" className={control}>{['USD','EUR','GBP','MAD','AED','SAR','USDC','USDT'].map(currency=><option key={currency}>{currency}</option>)}</select></label>
    <label>{tr('method')}<select className={control} value={method} onChange={e=>{setMethod(e.target.value);setPaid(e.target.value!=='COD');}}>
     {['CASH','COD','BANK','ONLINE'].map(value=><option key={value} value={value}>{officePayment(language,value)}</option>)}
    </select></label>
    {(['shipping','discount'] as const).map(key=><label key={key}>{tr(key)}<input name={key} type="number" inputMode="decimal" min={0} step="0.000001" className={control}/></label>)}
    <label className="flex items-center gap-2"><input type="checkbox" checked={paid} disabled={method!=='COD'} onChange={e=>setPaid(e.target.checked)}/>{tr('paidNow')}</label>
   </fieldset>
   {error&&<p role="alert" className="text-red-700">{tr(error)}</p>}
   <button disabled={busy||!products.length} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{tr(busy?'loading':'create')}</button>
  </form>
 </dialog>;
}
