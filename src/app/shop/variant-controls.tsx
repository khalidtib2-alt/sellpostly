'use client';
import {useLanguage} from '../language-context';
import {inventoryMessage} from './inventory-messages';
import {variantLabel,type StockVariant} from './inventory-data';

export function VariantPicker({variants,value,onChange,minStock=1}:{variants:StockVariant[];value?:string;onChange:(value:string)=>void;minStock?:number}){
 const {language}=useLanguage();
 const selected=variants.find(row=>row.id===value);
 if(!variants.length)return null;
 return <fieldset className="my-3 space-y-2">
  <legend className="sr-only">{inventoryMessage(language,'choose')}</legend>
  {(['size','color'] as const).map(key=>{
   const values=[...new Set(variants.map(row=>row[key]))];
   if(values.length===1&&!values[0])return null;
   const other=key==='size'?'color':'size';
   return <div key={key} role="group" aria-label={inventoryMessage(language,key)} className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-semibold">{inventoryMessage(language,key)}</span>
    {values.map(label=>{
     const candidates=variants.filter(row=>row[key]===label&&row.stockCount>=minStock&&(key!=='color'||!selected||row.size===selected.size));
     const target=candidates.find(row=>row[other]===selected?.[other])||candidates[0];
     return <button type="button" key={label} disabled={!target} aria-pressed={!!selected&&selected[key]===label} onClick={()=>target&&onChange(target.id)} dir="auto" className="rounded-full border px-3 py-1 text-sm aria-pressed:border-emerald-700 aria-pressed:bg-emerald-100 disabled:opacity-40">{label||'—'}</button>;
    })}
   </div>;
  })}
  {!selected&&<p className="text-sm">{inventoryMessage(language,'choose')}</p>}
  {selected&&selected.stockCount<minStock&&<p role="status" className="text-sm">{variantLabel(selected)} · {inventoryMessage(language,'unavailable')}</p>}
 </fieldset>;
}

export function VariantEditor({rows,onChange}:{rows:StockVariant[];onChange:(rows:StockVariant[])=>void}){
 const {t,language}=useLanguage(),tr=(key:Parameters<typeof inventoryMessage>[1])=>inventoryMessage(language,key);
 return <fieldset className="space-y-3 rounded-xl border p-3">
  <legend className="px-1 font-semibold">{tr('variants')}</legend>
  {rows.map((row,index)=><div key={row.id} className="grid items-end gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
   {(['size','color','sku','stockCount'] as const).map(key=><label key={key} className="text-sm">
    {tr(key==='stockCount'?'stock':key)}<input className="block w-full rounded border p-2" dir="auto" type={key==='stockCount'?'number':'text'}
     required={key==='stockCount'} min={0} max={1000000} maxLength={80} value={row[key]}
     onChange={e=>onChange(rows.map((value,i)=>i===index?{...value,[key]:key==='stockCount'?Number(e.target.value):e.target.value}:value))}/>
   </label>)}
   <button type="button" className="rounded border p-2" onClick={()=>onChange(rows.filter(value=>value.id!==row.id))}>{t('Remove')}</button>
  </div>)}
  <button type="button" disabled={rows.length>=100} className="rounded border p-2 disabled:opacity-50" onClick={()=>onChange([...rows,{id:crypto.randomUUID(),size:'',color:'',sku:'',stockCount:0}])}>{tr('add')}</button>
 </fieldset>;
}
