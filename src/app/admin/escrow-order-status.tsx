'use client';
import { useLanguage } from '../language-context';
import type { AdminOrder } from './admin-types';
export function OrderStatusPill({order,now}:{order:AdminOrder;now:number}){
 const {t,language}=useLanguage();
 const ready=order.status==='held'&&!!order.escrow_release_at&&new Date(order.escrow_release_at).getTime()<=now;
 const heldDate=order.escrow_release_at?new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(order.escrow_release_at)):'';
 const label=order.status==='pending'?t('Pending TxID'):order.status==='released'?t('Released'):order.status==='refunded'?t('Refunded'):order.status==='disputed'?t('Disputed'):order.status==='cancelled'?t('Cancelled'):ready?t('Ready to Release'):t('Held Until')+' '+heldDate;
 return <><span className={'inline-block rounded-full px-3 py-1 text-xs font-semibold '+(order.status==='disputed'?'bg-red-50 text-red-800':ready||order.status==='released'?'bg-emerald-50 text-emerald-800':'bg-slate-100 text-slate-800')}>{label}</span>{order.force_released_at&&<p className="mt-2 text-xs text-emerald-800">{t('Force Released (Buyer Confirmed)')}</p>}</>;
}
export function EmptyEscrowWorkflow(){
 const {t}=useLanguage();
 const stages=[['Pending TxID','Verify & Hold records a checked payment and starts its assigned hold.'],['Held Until','The snapshotted hold period determines the release date.'],['Ready to Release','Release Funds becomes available when the hold ends.'],['Released','Released seller balances become available for redemption.'],['Disputed','Review the dispute before releasing funds or recording a refund.'],['Refunded','The refund decision is recorded; transfers are handled separately.']] as const;
 return <div className="border-b bg-slate-50 p-6"><h3 className="text-lg font-bold">{t('No escrow orders yet')}</h3><p className="mt-2 text-sm text-slate-600">{t('This workflow preview explains the controls. It does not create orders or move money.')}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stages.map(([label,help])=><article key={label} className="rounded-xl border bg-white p-4"><span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{t(label)}{label==='Held Until'?' · '+t('Release date'):''}</span><p className="mt-3 text-sm text-slate-600">{t(help)}</p></article>)}</div><div className="mt-5 flex flex-wrap gap-2">{(['Verify & Hold','Release Funds','Refund Buyer','Cancel'] as const).map(label=><button type="button" disabled key={label} className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold opacity-60">{t(label)}</button>)}</div><p className="mt-4 text-sm text-slate-600">{t('Early force release requires a matching buyer receipt confirmation and an explicit admin override.')}</p></div>;
}

