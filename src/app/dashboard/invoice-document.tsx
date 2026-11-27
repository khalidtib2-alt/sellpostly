'use client';
import {useLanguage} from '../language-context';
import {officeMessage,officePayment} from './back-office-messages';
import {officeMoney,type Sale} from './back-office-data';
import {isReturned,paymentLabel,moneyUnits,moneyText} from '../../lib/back-office-report';

export type Invoice={sale:Sale;paid:boolean;hideBrand:boolean;seller:{name:string;logo:string;email:string;phone:string;slug:string}};
export default function InvoiceDocument({invoice}:{invoice:Invoice}){
 const {language}=useLanguage(),tr=(key:Parameters<typeof officeMessage>[1])=>officeMessage(language,key);
 const {sale,seller,paid,hideBrand}=invoice,buyer=sale.details.buyer,items=sale.details.items||[];
 const money=(value:string)=>officeMoney(language,value,sale.coin);
 const subtotal=items.length?items.reduce((sum,item)=>sum+moneyUnits(item.line_total),BigInt(0)):moneyUnits(sale.gross_amount)-moneyUnits(sale.shipping_amount)+moneyUnits(sale.discount_amount);
 return <article className="invoice-print mx-auto max-w-4xl rounded-xl border bg-white p-6 text-slate-900 sm:p-10">
  <div className="grid gap-6 border-b pb-6 sm:grid-cols-2">
   <div>{seller.logo&&<img src={seller.logo} alt={seller.name} className="mb-3 h-16 max-w-40 object-contain"/>}<h1 className="text-2xl font-black">{seller.name}</h1>
    {seller.email&&<p dir="auto">{seller.email}</p>}{seller.phone&&<p dir="auto">{seller.phone}</p>}
    {seller.slug&&<a href={'/s/'+encodeURIComponent(seller.slug)+'/personal'} className="text-sm underline">/s/{seller.slug}/personal</a>}
   </div>
   <div className="sm:text-end"><h2 className="text-xl font-bold">{tr(sale.source==='manual'?'receipt':'invoice')}</h2>
    <p>{tr('number')} <strong dir="ltr">{sale.invoice_number}</strong></p>
    <p>{new Intl.DateTimeFormat(language,{dateStyle:'long',timeZone:'UTC'}).format(new Date(sale.created_at))}</p>
    <p>{officePayment(language,paymentLabel(sale))} · {tr(isReturned(sale)?'returned':paid?'paid':sale.payment_method==='COD'?'cod':'unpaid')}</p>
   </div>
  </div>
  <div className="my-6"><h3 className="font-bold">{tr('billTo')}</h3><p dir="auto">{buyer?.name||'—'}</p>
   {[buyer?.phone,buyer?.contact,buyer?.city,sale.details.delivery_note].filter(Boolean).map((value,index)=><p className="whitespace-pre-wrap" key={index} dir="auto">{value}</p>)}
  </div>
  <div className="overflow-x-auto"><table className="w-full text-sm">
   <thead><tr className="bg-slate-100">{(['product','variant','quantity','price','total'] as const).map(key=><th key={key} scope="col" className="p-2 text-start">{tr(key)}</th>)}</tr></thead>
   <tbody>{items.map((item,index)=><tr key={index} className="border-b"><td className="p-2" dir="auto">{item.name}</td>
    <td className="p-2" dir="auto">{[item.size,item.color].filter(Boolean).join(' / ')||item.variantLabel||'—'}</td>
    <td className="p-2">{new Intl.NumberFormat(language).format(item.quantity)}</td><td className="p-2">{money(item.unit_price)}</td><td className="p-2">{money(item.line_total)}</td>
   </tr>)}</tbody>
  </table></div>
  <dl className="ms-auto mt-6 max-w-sm space-y-2">{([['subtotal',moneyText(subtotal)],['shipping',sale.shipping_amount],['discount',sale.discount_amount],['total',sale.gross_amount]] as const)
   .map(([label,value])=><div key={label} className={label==='total'?'flex justify-between border-t pt-2 font-bold':'flex justify-between'}><dt>{tr(label)}</dt><dd>{money(value)}</dd></div>)}</dl>
  {!hideBrand&&<p className="mt-8 border-t pt-4 text-sm text-slate-500">{tr('brand')}</p>}
 </article>;
}
