'use client';
import {useEffect,useState} from 'react';
import {useLanguage} from '../language-context';
import {officeMessage} from './back-office-messages';
import {officeRequest} from './back-office-client';
import InvoiceDocument,{type Invoice} from './invoice-document';

export default function InvoiceView({orderId}:{orderId:string}){
 const {language,t}=useLanguage(),[invoice,setInvoice]=useState<Invoice>(),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  officeRequest(new URLSearchParams({invoice:orderId}),{signal:controller.signal}).then(response=>response.json()).then(setInvoice)
   .catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return ()=>controller.abort();
 },[orderId]);
 return <main className="mx-auto max-w-5xl px-5 py-8">
  <div className="mb-5 flex flex-wrap justify-between gap-4 print:hidden">
   <a href="/dashboard" className="underline">{t('Seller Dashboard')}</a>
   {invoice&&<button type="button" onClick={()=>window.print()} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">{officeMessage(language,'print')}</button>}
  </div>
  {error?<p role="alert">{officeMessage(language,error==='AUTH_REQUIRED'?'signIn':'failed')}</p>:invoice?<InvoiceDocument invoice={invoice}/>:<p role="status">{officeMessage(language,'loading')}</p>}
  <style>{'@media print { body:has(.invoice-print) * {visibility:hidden} .invoice-print,.invoice-print * {visibility:visible!important} .invoice-print{position:absolute;inset:0;width:100%;max-width:none;border:0;padding:0} .invoice-print tr{break-inside:avoid} .invoice-print table{overflow:visible} @page{margin:16mm} }'}</style>
 </main>;
}
