'use client';
import {useLanguage} from '../language-context';
import {quickReplyUrl} from '../../lib/whatsapp-replies';
import type {Order} from './dashboard-types';
export default function WhatsAppQuickReplies({order,store,delivery}:{order:Order;store:string;delivery?:{tracking:string;delivery_notes:string}}){
 const {t,language}=useLanguage();
 const replies=([['confirmed','Order Confirmed'],['delivered','Digital Key / Tracking Delivered'],['followup','Delivery Follow-Up']] as const).map(([kind,label])=>({label,url:quickReplyUrl(kind,language,order,store,delivery)}));
 return <div className="mt-3 space-y-2"><p className="text-xs font-semibold">{t('WhatsApp Quick Replies')}</p><div className="flex flex-wrap gap-2">{replies.map(({label,url})=>url?<a key={label} href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-900">{t(label)}</a>:<button key={label} type="button" disabled className="rounded-lg border px-2 py-2 text-xs opacity-50">{t(label)}</button>)}</div>{!replies[0].url&&<p className="max-w-60 text-xs text-slate-600">{t('A buyer international phone number is needed for WhatsApp replies.')}</p>}</div>;
}

