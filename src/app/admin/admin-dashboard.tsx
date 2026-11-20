'use client';
import { useEffect,useRef,useState } from 'react';
import { useLanguage } from '../language-context';
import { OrderStatusPill,EmptyEscrowWorkflow } from './escrow-order-status';
import { DisputeToolbar,BuyerDisputeReason } from './dispute-order-tools';
import ProUpgradeRequests from './pro-upgrade-requests';
import {publicLink} from '../../lib/public-url';
import BrandLogo from '../brand-logo';
import type { Message } from '../translations';
import type { Overview,Subscription,AdminOrder,AdminPayout,AdminShop } from './admin-types';
const storage='sellpostly-admin-session';
const button='rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const field='mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3';
const statusNames={pending:'Pending',held:'Held',released:'Released / Success',disputed:'Disputed',refunded:'Failed / Refunded',cancelled:'Cancelled',approved:'Approved',paid:'Paid',rejected:'Rejected',active:'Active',revoked:'Revoked',expired:'Expired'} as const;
type Edit={kind:'orders';record:AdminOrder}|{kind:'payouts';record:AdminPayout}|{kind:'shops';record:AdminShop}|{kind:'subscriptions';record:Subscription};
export default function AdminDashboard(){
 const {t,language,setLanguage}=useLanguage();
 const [key,setKey]=useState(''),[token,setToken]=useState(''),[data,setData]=useState<Overview|null>(null),[subs,setSubs]=useState<Subscription[]>([]);
 const [orderFilter,setOrderFilter]=useState<'all'|'disputed'>('all');
 const [tab,setTab]=useState('orders'),[busy,setBusy]=useState(false),[message,setMessage]=useState<Message|''>(''),[edit,setEdit]=useState<Edit|null>(null);
 const [forceRelease,setForceRelease]=useState(false),[now,setNow]=useState(Date.now());
 const [action,setAction]=useState(''),[note,setNote]=useState(''),[tx,setTx]=useState(''),[verified,setVerified]=useState(false),[suspended,setSuspended]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),generation=useRef(0);
 const status=(value:string)=>t(statusNames[value as keyof typeof statusNames]||'Pending');
 const date=(value:string|null)=>value?new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):t('Awaiting verification');
 async function api(url:string,secret:string,method='GET',value?:unknown){
  const response=await fetch(url,{method,headers:{'x-admin-key':secret,'Content-Type':'application/json'},...(value===undefined?{}:{body:JSON.stringify(value)}),cache:'no-store'});
  const result=await response.json();if(!response.ok)throw Error(result.error||'REQUEST_FAILED');return result;
 }
 function showError(error:unknown){
  const code=(error as Error).message;
  setMessage(code==='BUYER_CONFIRMATION_REQUIRED'?'Buyer confirmation is required for early release.':code==='INVALID_HOLD_PERIOD'?'Choose a whole-number hold period from 3 to 15 days.':code==='ADMIN_UNAUTHORIZED'?'Admin access denied. Check your key.':code==='TRANSITION_NOT_ALLOWED'?'Action unavailable. Check the current status and escrow hold deadline.':code==='INVALID_TX'?'Enter the complete transaction hash for this network.':code==='INVALID_INPUT'?'Check the action and entered values.':'Could not load or save admin data. Check your connection, database migration and server configuration.');
 }
 function logout(){generation.current++;try{sessionStorage.removeItem(storage);}catch{}setToken('');setKey('');setData(null);setSubs([]);setMessage('');setEdit(null);dialog.current?.close();}
 async function load(secret:string){
  const current=generation.current;setBusy(true);
  try{
   const [overview,subscriptions]=await Promise.all([api('/api/admin/overview',secret),api('/api/admin/subscriptions',secret)]);
   if(current!==generation.current)return;setData(overview);setSubs(subscriptions);setToken(secret);setKey('');
   try{sessionStorage.setItem(storage,secret);}catch{}
  }catch(error){if(current===generation.current){if((error as Error).message==='ADMIN_UNAUTHORIZED'){try{sessionStorage.removeItem(storage);}catch{}setData(null);setToken('');}showError(error);}}
  finally{if(current===generation.current)setBusy(false);}
 }
 useEffect(()=>{try{const saved=sessionStorage.getItem(storage);if(saved)load(saved);}catch{}return()=>{generation.current++;};},[]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),20000);return()=>window.clearInterval(timer);},[]);
 function open(value:Edit,requestedAction?:string){
  setEdit(value);setForceRelease(false);setNote('');setTx('');setMessage('');
  setAction(requestedAction||(value.kind==='orders'?(value.record.status==='pending'?'verify':'release'):value.kind==='payouts'?(value.record.status==='pending'?'approve':'paid'):value.kind==='subscriptions'?(value.record.status==='active'?'revoke':'activate'):''));
  if(value.kind==='shops'){setVerified(value.record.verified);setSuspended(value.record.suspended);}
  dialog.current?.showModal();
 }
 const actionNames={verify:'Confirm Funds Arrived',release:'Release Escrow Funds',refund:'Refund Buyer',cancel:'Cancel',approve:'Approve Payout',paid:'Mark Paid',reject:'Reject Payout',activate:'Activate Subscription',revoke:'Revoke Subscription'} as const;
 let actions:string[]=[];
 if(edit?.kind==='orders')actions=(edit.record.payment_method||'CRYPTO')!=='CRYPTO'?[]:edit.record.status==='pending'?['verify','cancel']:['held','disputed'].includes(edit.record.status)?['release','refund']:[];
 if(edit?.kind==='payouts')actions=edit.record.status==='pending'?['approve','reject']:edit.record.status==='approved'?['paid','reject']:[];
 if(edit?.kind==='subscriptions')actions=['activate','revoke'];
 const earlyRelease=edit?.kind==='orders'&&action==='release'&&(!edit.record.escrow_release_at||new Date(edit.record.escrow_release_at).getTime()>Date.now());
 const buyerConfirmed=edit?.kind==='orders'&&!!edit.record.details.buyer_confirmed_at;
 async function saveHold(id:string,days:number){
  if(busy)return;setBusy(true);
  try{await api('/api/admin/shops/'+id,token,'POST',{escrow_hold_days:days});setMessage('Admin-assigned hold saved. Existing orders keep their original deadline.');await load(token);}catch(error){showError(error);}finally{setBusy(false);}
 }
 async function save(event:React.FormEvent){
  event.preventDefault();if(!edit||busy||(earlyRelease&&(!forceRelease||!buyerConfirmed)))return;setBusy(true);
  try{
   const url='/api/admin/'+edit.kind+(edit.kind==='subscriptions'?'':'/'+edit.record.id);
   const value=edit.kind==='shops'?{verified,suspended}:edit.kind==='subscriptions'?{owner_key:edit.record.owner_key,action}:{action,note,tx_id:tx,forceRelease:action==='release'&&forceRelease};
   await api(url,token,'POST',value);dialog.current?.close();setEdit(null);setMessage('Admin change saved. No funds were transferred.');await load(token);
  }catch(error){showError(error);}finally{setBusy(false);}
 }
 useEffect(()=>{
  if(!token||busy||edit)return;
  const refresh=()=>{if(document.visibilityState==='visible')load(token);};
  const timer=window.setInterval(refresh,15000);window.addEventListener('focus',refresh);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[token,busy,edit]);
 const disputedCount=(data?.orders||[]).filter(order=>order.status==='disputed').length;
 const orderRows=(data?.orders||[]).filter(order=>orderFilter==='all'||order.status==='disputed');
 const metrics=[['Total GMV','total_gmv'],['5% Commission','total_commission_5pct'],['Active Escrow Held','active_escrow_held'],['Pending Payouts','pending_payouts'],['Paid Payouts','paid_payouts']] as const;
 return <main className="mx-auto min-h-screen max-w-7xl px-5 py-8">
  <header className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-6"><BrandLogo/><div className="flex flex-wrap items-center gap-3"><div role="group" aria-label={t('Language')} className="flex rounded-full border bg-white p-1">{(['en','fr','ar'] as const).map(code=><button type="button" key={code} lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)} className={language===code?'rounded-full bg-emerald-700 px-3 py-1 text-sm font-bold text-white':'rounded-full px-3 py-1 text-sm font-bold'}>{code==='ar'?'العربية':code.toUpperCase()}</button>)}</div>{data&&<button disabled={busy} className="text-sm underline" onClick={logout}>{t('Lock Admin Session')}</button>}</div></header>
  {!data?<section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-emerald-800">SellPostly</p><h1 className="mt-2 text-3xl font-black">{t('Admin Control Center')}</h1><p className="mt-4 text-sm text-slate-600">{t('Enter your admin key to review stores and accounting records.')}</p><form className="mt-6" onSubmit={e=>{e.preventDefault();setMessage('');load(key);}}><label className="font-semibold">{t('Admin Secret Key')}<input type="password" dir="ltr" required autoComplete="off" maxLength={4096} className={field} value={key} onChange={e=>setKey(e.target.value)}/></label><p className="my-4 text-xs text-slate-600">{t('The key is kept in this browser tab session only.')}</p><button disabled={busy} className={button}>{t(busy?'Checking admin access…':'Unlock Admin')}</button></form>{message&&<p role="alert" className="mt-4 text-sm">{t(message)}</p>}</section>:<>
  <div className="mb-6 flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-black">{t('Admin Control Center')}</h1><p className="mt-3 max-w-3xl text-sm text-slate-600">{t('Accounting records only. Verify transfers independently; these controls never sign or send funds.')}</p></div><button disabled={busy} className={button} onClick={()=>load(token)}>{t('Refresh')}</button></div>
  {message&&<p role="status" className="mb-5 rounded-xl border bg-slate-50 p-4">{t(message)}</p>}
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label,value])=><article key={value} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-600">{t(label)}</h2><div className="mt-3 space-y-2">{data.balances.length?data.balances.map(balance=><div key={balance.coin+balance.network}><p dir="ltr" className="break-all text-xl font-bold tabular-nums">{balance[value]} {balance.coin}</p><p className="text-xs text-slate-600">{balance.network}</p></div>):<p className="text-2xl font-bold tabular-nums">0.000000</p>}</div></article>)}<article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-600">{t('Active Subscriptions')}</h2><p className="mt-3 text-3xl font-bold tabular-nums">{data.active_subscriptions}</p></article></section>
  <p className="my-4 text-xs text-slate-600">{t('Each coin and network has separate totals. Unverified and refunded payments are excluded from GMV.')}</p>
  <div role="tablist" aria-label={t('Admin Sections')} className="my-7 flex flex-wrap gap-2">{([['orders','Escrow Orders & Disputes'],['payouts','Seller Redeems ($10+)'],['shops','Stores (Verify / Suspend)'],['subscriptions','Pro Subscriptions']] as const).map(([value,label])=><button role="tab" id={'tab-'+value} aria-controls={'panel-'+value} aria-selected={tab===value} key={value} className={tab===value?button:'rounded-lg border px-4 py-2 text-sm font-semibold'} onClick={()=>setTab(value)}>{t(label)}</button>)}</div>
  <section role="tabpanel" id={'panel-'+tab} aria-labelledby={'tab-'+tab} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
  {tab==='orders'&&<DisputeToolbar count={disputedCount} total={data.orders.length} selected={orderFilter} onFilter={setOrderFilter}/>}
  {tab==='orders'&&!data.orders.length&&<EmptyEscrowWorkflow/>}
  {tab==='orders'&&<table className="w-full min-w-[950px] text-sm"><thead className="bg-slate-50"><tr>{(['Order','Store','Amount','Status','Escrow release','Review'] as const).map(label=><th className="p-4 text-start" key={label}>{t(label)}</th>)}</tr></thead><tbody>{orderRows.map(order=><tr key={order.id} className={order.status==='disputed'?"border-t border-s-4 border-red-300 align-top":"border-t align-top"}><td className="max-w-64 p-4"><p dir="ltr" className="break-all font-mono text-xs">{order.id}</p>{order.status==='disputed'&&<BuyerDisputeReason reason={order.details.dispute?.reason}/>}<details className="mt-3"><summary className="cursor-pointer font-semibold">{t('Order Details')}</summary><p className="mt-2">{order.details.buyer?.name} · {order.details.buyer?.contact}</p><p className="mt-2 font-semibold">{t('Transaction Hash (TxID)')}</p><p dir="ltr" className="break-all text-xs">{order.tx_id}</p><ul className="my-2">{order.details.items?.map(item=><li key={item.id}>{item.name} × {item.quantity}</li>)}</ul><pre dir="auto" className="max-w-72 whitespace-pre-wrap break-words text-xs">{JSON.stringify(order.details,null,2)}</pre></details></td><td className="max-w-64 p-4">{order.shop_name}<p className="mt-3 text-xs font-semibold">{t('Seller USDC Wallet Address (Polygon)')}</p><p dir="ltr" className="break-all font-mono text-xs">{order.seller_wallet||t('Not configured')}</p>{order.seller_wallet&&<button type="button" className="mt-2 text-xs underline" onClick={async()=>{try{await navigator.clipboard.writeText(order.seller_wallet!);setMessage('Copied!');}catch{setMessage('Copy failed. Select the text to copy it manually.');}}}>{t('Copy Address')}</button>}<p className="mt-3 text-xs font-semibold">{t('Buyer Email')}</p><p dir="auto" className="break-all text-xs">{order.buyer_email||t('Not configured')}</p></td><td dir="ltr" className="p-4 tabular-nums">{order.gross_amount} {order.coin}<p className="text-xs text-slate-600">{order.network}</p></td><td className="p-4">{(order.payment_method||'CRYPTO')!=='CRYPTO'?<span className="rounded-full bg-slate-100 px-3 py-1">{t('Direct Payment — No Escrow')} · {t(order.status==='fulfilled'?'Shipped':'Pending')}</span>:<OrderStatusPill order={order} now={now}/>}</td><td className="p-4">{(order.payment_method||'CRYPTO')!=='CRYPTO'?t('Direct Payment — No Escrow'):date(order.escrow_release_at)}<p className="text-xs">{(order.payment_method||'CRYPTO')!=='CRYPTO'?'':order.escrow_hold_days+' '+t('days')}</p></td><td className="min-w-72 p-4"><div className="flex flex-wrap gap-2">{([['verify','Confirm Funds Arrived'],['release','Release Escrow Funds'],['refund','Refund Buyer'],['cancel','Cancel']] as const).map(([value,label])=><button type="button" key={value} disabled={busy||(order.payment_method||'CRYPTO')!=='CRYPTO'||((value==='verify'||value==='cancel')?order.status!=='pending':!['held','disputed'].includes(order.status))} className={value==='verify'||value==='release'?button:'rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40'} onClick={()=>open({kind:'orders',record:order},value)}>{t(label)}</button>)}</div></td></tr>)}</tbody></table>}
  {tab==='orders'&&data.orders.length>0&&!orderRows.length&&<p className="p-6 text-slate-600">{t('No disputed orders right now.')}</p>}
  {tab==='payouts'&&<table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50"><tr>{(['Store','Amount','Receiving Wallet','Status','Review'] as const).map(label=><th className="p-4 text-start" key={label}>{t(label)}</th>)}</tr></thead><tbody>{data.payouts.map(payout=><tr key={payout.id} className="border-t align-top"><td className="p-4">{payout.shop_name}<p className="mt-2 max-w-44 break-all font-mono text-xs" dir="ltr">{payout.id}</p></td><td dir="ltr" className="p-4 tabular-nums">{payout.amount} {payout.coin}<p className="text-xs text-slate-600">{payout.network}</p></td><td className="max-w-64 break-all p-4 font-mono text-xs" dir="ltr">{payout.wallet}{payout.tx_id&&<p className="mt-3">{payout.tx_id}</p>}</td><td className="p-4">{status(payout.status)}</td><td className="p-4">{['pending','approved'].includes(payout.status)&&<button disabled={busy} className="font-semibold underline" onClick={()=>open({kind:'payouts',record:payout})}>{t('Review / Update')}</button>}</td></tr>)}</tbody></table>}
  {tab==='shops'&&<table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50"><tr>{(['Store','Public Link','Escrow Hold Period','Verified Store','Suspended','Review'] as const).map(label=><th className="p-4 text-start" key={label}>{t(label)}</th>)}</tr></thead><tbody>{data.shops.map(shop=><tr key={shop.id} className="border-t"><td className="p-4">{shop.name}<p className="mt-2 max-w-44 break-all font-mono text-xs" dir="ltr">{shop.id}</p></td><td className="p-4"><a href={publicLink('/s/'+shop.slug)} target="_blank" rel="noopener noreferrer" className="underline">{shop.slug}</a></td><td className="p-4"><label className="text-xs font-semibold">{t('Escrow Hold Period')}<select aria-label={t('Escrow Hold Period')+' · '+shop.name} className={field} disabled={busy} value={shop.escrow_hold_days} onChange={e=>saveHold(shop.id,Number(e.target.value))}>{Array.from({length:13},(_,i)=>i+3).map(days=><option key={days} value={days}>{days} {t('days')}</option>)}</select></label></td><td className="p-4">{t(shop.verified?'Yes':'No')}</td><td className="p-4">{t(shop.suspended?'Yes':'No')}</td><td className="p-4"><button disabled={busy} className="font-semibold underline" onClick={()=>open({kind:'shops',record:shop})}>{t('Verify / Suspend')}</button></td></tr>)}</tbody></table>}
  {tab==='subscriptions'&&<ProUpgradeRequests token={token}/>}
  {tab==='subscriptions'&&<table className="w-full min-w-[750px] text-sm"><thead className="bg-slate-50"><tr>{(['License Fingerprint','Provider','Status','Expires','Last Verification','Review'] as const).map(label=><th className="p-4 text-start" key={label}>{t(label)}</th>)}</tr></thead><tbody>{subs.map(subscription=><tr key={subscription.owner_key} className="border-t"><td className="max-w-56 break-all p-4 font-mono text-xs" dir="ltr">{subscription.owner_key}</td><td className="p-4">{subscription.provider==='master'?t('Master Key'):subscription.provider==='development'?t('Development'):subscription.provider==='crypto'?t('Crypto (Polygon)'):'Gumroad'}</td><td className="p-4">{status(subscription.status)}</td><td className="p-4">{subscription.expires_at?date(subscription.expires_at):t('No Expiry')}</td><td className="p-4">{date(subscription.verified_at)}</td><td className="p-4"><button disabled={busy} className="font-semibold underline" onClick={()=>open({kind:'subscriptions',record:subscription})}>{t('Review / Update')}</button></td></tr>)}</tbody></table>}
  {tab!=='orders'&&!(tab==='orders'?data.orders.length:tab==='payouts'?data.payouts.length:tab==='shops'?data.shops.length:subs.length)&&<p className="p-6 text-slate-600">{t('No records in this section.')}</p>}
  </section>
  </>}
  <dialog ref={dialog} aria-labelledby="admin-action-title" className="m-auto max-h-[90dvh] w-[min(95vw,32rem)] overflow-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 backdrop:bg-black/50"><div className="flex justify-between gap-4"><h2 id="admin-action-title" className="text-xl font-bold">{t('Review / Update')}</h2><button disabled={busy} onClick={()=>{dialog.current?.close();setEdit(null);}}>{t('Close')}</button></div>
   {edit&&<form onSubmit={save} className="mt-5 space-y-5">
    {edit.kind==='shops'?<><p className="font-semibold">{edit.record.name}</p><label className="flex items-center gap-3"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>{t('Verified Store')}</label><label className="flex items-center gap-3"><input type="checkbox" checked={suspended} onChange={e=>setSuspended(e.target.checked)}/>{t('Suspend Store')}</label><p className="text-sm text-slate-600">{t('Suspension hides the public storefront and blocks new orders. Existing order reviews remain available.')}</p></>:<><label className="block">{t('Action')}<select className={field} value={action} onChange={e=>{setAction(e.target.value);setForceRelease(false);}}>{actions.map(value=><option key={value} value={value}>{t(actionNames[value as keyof typeof actionNames])}</option>)}</select></label>
    {edit.kind==='orders'&&<><label className="block">{t('Admin Review Note')}<textarea rows={4} className={field} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label><p className="text-sm text-slate-600">{t('Verify the destination, token, network, amount and transaction before recording payment as held.')}</p>{action==='release'&&<div className="rounded-xl border p-4"><label className="flex items-center gap-3"><input type="checkbox" checked={forceRelease} disabled={!buyerConfirmed} onChange={e=>setForceRelease(e.target.checked)}/>{t('Force Release (Buyer Confirmed)')}</label><p className="mt-2 text-xs text-slate-600">{t(buyerConfirmed?'Buyer receipt is confirmed. An explicit override can release before the original deadline.':'Buyer confirmation is required for early release.')}</p></div>}{earlyRelease&&!forceRelease&&<p role="status" className="rounded-lg border p-3">{t('The original escrow hold has not ended. Early release is blocked.')}</p>}</>}
    {edit.kind==='payouts'&&<><p dir="ltr" className="break-all text-sm">{edit.record.amount} {edit.record.coin} · {edit.record.network}<br/>{edit.record.wallet}</p>{action==='paid'&&<label className="block">{t('Payout TxID (Optional)')}<input className={field} dir="ltr" maxLength={100} value={tx} onChange={e=>setTx(e.target.value)}/></label>}<p className="text-sm text-slate-600">{t('Approve first. Mark paid only after independently completing the transfer.')}</p></>}
    {edit.kind==='subscriptions'&&<p className="text-sm text-slate-600">{t('Revocation blocks subsequent Pro requests. Activation still requires a valid master or Gumroad license.')}</p>}
    </>}
    <button disabled={busy||!!(earlyRelease&&(!forceRelease||!buyerConfirmed))} className={button}>{t(busy?'Saving…':'Save Admin Change')}</button>{message&&<p role="status">{t(message)}</p>}
   </form>}
  </dialog>
 </main>;
}

