'use client';
import { useLanguage } from '../language-context';
export function DisputeToolbar({count,total,selected,onFilter}:{count:number;total:number;selected:'all'|'disputed';onFilter:(value:'all'|'disputed')=>void}){
 const {t}=useLanguage();
 return <div className="border-b border-slate-200 p-5">
  <div className="flex flex-wrap items-center gap-3">
   <button type="button" aria-pressed={selected==='disputed'} onClick={()=>onFilter('disputed')} className="inline-flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-3 font-bold text-red-800">
    {t('Disputed Orders')}<span aria-live="polite" className="rounded-full bg-red-700 px-3 py-1 text-white tabular-nums">{count}</span>
   </button>
   <button type="button" aria-pressed={selected==='all'} onClick={()=>onFilter('all')} className={selected==='all'?'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white':'rounded-lg border px-4 py-2 text-sm font-semibold'}>{t('All Orders')} ({total})</button>
  </div>
  <p className="mt-3 text-xs text-slate-600">{t('Disputes refresh automatically while this page is visible. Refund Buyer and Release Funds remain subject to the existing escrow rules.')}</p>
 </div>;
}
export function BuyerDisputeReason({reason}:{reason?:string}){
 const {t}=useLanguage();
 return <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
  <p className="font-bold text-red-800">{t('Buyer Dispute Reason')}</p>
  <p dir="auto" className="mt-2 whitespace-pre-wrap break-words text-sm text-red-900">{reason||t('No dispute reason was recorded.')}</p>
 </div>;
}

