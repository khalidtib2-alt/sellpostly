'use client';

import {useEffect,useState} from 'react';
import {useLanguage} from '../language-context';
import {shopHeaders} from '../shop/multi-shop-data';
import {inventoryMessage} from '../shop/inventory-messages';
import {stockReasons} from '../shop/inventory-data';
import {inventoryPageSize,type StockMovement} from '../shop/inventory-history-data';
import type {Shop} from '../shop/shop-data';

type History = {canExport:boolean;shopId:string|null;movements:StockMovement[];hasMore:boolean};
const control='rounded-lg border border-slate-300 px-3 py-2';

export default function InventoryDashboard(){
 const {language,t}=useLanguage(),tr=(key:Parameters<typeof inventoryMessage>[1])=>inventoryMessage(language,key);
 const [shops,setShops]=useState<Shop[]>([]),[shopId,setShopId]=useState(''),[reason,setReason]=useState(''),[search,setSearch]=useState('');
 const [offset,setOffset]=useState(0),[history,setHistory]=useState<History>(),[loading,setLoading]=useState(true);
 const [error,setError]=useState<'error'|'signIn'>(),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/shops',{headers:shopHeaders(localStorage),signal:controller.signal}).then(response=>response.ok?response.json():null)
   .then(result=>{if(result)setShops((result.shops as Shop[]).filter(shop=>shop.shopMode==='personal'&&shop.shopId));}).catch(()=>{});
  return ()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  const params=new URLSearchParams({reason,search,offset:String(offset)});
  if(shopId)params.set('shopId',shopId);
  setLoading(true);setError(undefined);setHistory(undefined);
  const timer=setTimeout(async()=>{
   try{
    const response=await fetch('/api/seller/inventory?'+params,{headers:shopHeaders(localStorage),signal:controller.signal});
    if(response.status===401){setError('signIn');return;}
    if(!response.ok)throw Error();
    setHistory(await response.json());
   }catch{if(!controller.signal.aborted)setError('error');}
   finally{if(!controller.signal.aborted)setLoading(false);}
  },150);
  return ()=>{clearTimeout(timer);controller.abort();};
 },[shopId,reason,search,offset]);

 async function download(){
  if(!history?.shopId||!history.canExport||exporting)return;
  setExporting(true);setExportError(false);
  try{
   const params=new URLSearchParams({shopId:history.shopId,format:'csv'});
   const response=await fetch('/api/seller/inventory?'+params,{headers:shopHeaders(localStorage)});
   if(!response.ok)throw Error();
   const url=URL.createObjectURL(await response.blob());
   const anchor=document.createElement('a');
   anchor.href=url;anchor.download='sellpostly-inventory.csv';anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setExportError(true);}finally{setExporting(false);}
 }

 return <main className="mx-auto max-w-7xl px-5 py-10">
  <h1 className="mb-5 text-3xl font-black">{tr('inventory')}</h1>
  <section className="rounded-xl border bg-white p-5">
   <h2 className="mb-4 text-xl font-bold">{tr('history')}</h2>
   <div className="mb-4 flex flex-wrap gap-3">
    <label className="grid gap-1 text-sm">{t('Active Shop')}<select className={control} value={shopId} onChange={e=>{setShopId(e.target.value);setOffset(0);}}>
     <option value="">{t('Primary Personal Store')}</option>
     {shops.filter(shop=>shop.storeMode==='niche').map(shop=><option key={shop.shopId} value={shop.shopId}>{shop.name}</option>)}
    </select></label>
    <label className="grid gap-1 text-sm">{tr('reason')}<select className={control} value={reason} onChange={e=>{setReason(e.target.value);setOffset(0);}}>
     <option value="">{tr('all')}</option>{stockReasons.map(value=><option key={value} value={value}>{tr(value)}</option>)}
    </select></label>
    <label className="grid min-w-48 flex-1 gap-1 text-sm">{tr('search')}<input value={search} maxLength={120} onChange={e=>{setSearch(e.target.value);setOffset(0);}} className={control}/></label>
   </div>
   {loading&&<p role="status">{tr('loading')}</p>}
   {error&&<p role="alert">{error==='signIn'?<a className="underline" href="/shop">{tr(error)}</a>:tr(error)}</p>}
   {history&&!history.shopId&&<p>{tr('noShop')}</p>}
   {history?.shopId&&<>
    {history.movements.length?<div className="overflow-x-auto rounded-lg border">
     <table className="w-full min-w-[44rem] text-sm">
      <thead><tr>{(['date','product','variant','sku','delta','reason','note'] as const).map(key=><th key={key} scope="col" className="bg-slate-50 p-3 text-start">{tr(key)}</th>)}</tr></thead>
      <tbody>{history.movements.map(move=><tr key={move.id} className="border-t">
       <td className="p-3">{new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(move.created_at))}</td>
       <td dir="auto" className="p-3">{move.product_name}</td><td dir="auto" className="p-3">{move.variant_label||'—'}</td>
       <td dir="auto" className="p-3">{move.sku||'—'}</td>
       <td className="p-3 tabular-nums">{new Intl.NumberFormat(language,{signDisplay:'exceptZero'}).format(move.delta)}</td>
       <td className="p-3">{tr(move.reason)}</td><td dir="auto" className="p-3">{move.note||'—'}</td>
      </tr>)}</tbody>
     </table>
    </div>:<p>{tr('empty')}</p>}
    <div className="mt-3 flex gap-2">
     {offset>0&&<button type="button" className={control} onClick={()=>setOffset(offset-inventoryPageSize)}>{tr('previous')}</button>}
     {history.hasMore&&<button type="button" className={control} onClick={()=>setOffset(offset+inventoryPageSize)}>{tr('next')}</button>}
    </div>
   </>}
   {history&&<div className="mt-5 border-t pt-4">
    {history.canExport?<button type="button" disabled={!history.shopId||exporting} onClick={()=>void download()} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{tr(exporting?'loading':'export')}</button>
     :<><p>{tr('upgrade')}</p><a href="/pricing" className="mt-2 inline-block font-semibold text-emerald-800 underline">{tr('plans')}</a></>}
    {exportError&&<p role="alert">{tr('error')}</p>}
   </div>}
  </section>
 </main>;
}
