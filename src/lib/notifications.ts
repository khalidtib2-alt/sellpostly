import 'server-only';
import {createHash} from 'node:crypto';
import {db} from './db';
import {sendEmail,emailAddress,type EmailData,type EmailKind} from './email';
import type {Query} from './order-service';
const run:Query=async(sql,args)=>await (await db()).query(sql,args);
// Called only after the business update commits. No notification failure escapes.
export async function notifyEvent(kind:EmailKind,id:string,query:Query=run,request:typeof fetch=fetch){
 if(!process.env.RESEND_API_KEY?.trim())return;
 try{
  let to:string|null=null,data:EmailData|undefined,event='sellpostly:'+kind+':'+id;
  if(kind==='pro'){
   const row=(await query("SELECT email,language,issued_license_key,amount_usd::text,coin,network FROM pro_upgrade_requests WHERE id=$1::uuid AND status='approved'",[id]))[0];
   if(!row)return;to=emailAddress(row.email);data={kind,id,language:row.language,key:row.issued_license_key,amount:row.amount_usd,coin:row.coin,network:row.network};
  }else if(kind==='payout'){
   const row=(await query("SELECT p.amount::text,p.coin,p.network,s.name,s.slug,sub.email,sub.language FROM payout_requests p JOIN shops s ON s.id=p.shop_id JOIN subscriptions sub ON sub.owner_key=s.owner_key WHERE p.id=$1::uuid AND p.status='paid'",[id]))[0];
   if(!row)return;to=emailAddress(row.email);data={kind,id,store:row.name,slug:row.slug,language:row.language,amount:row.amount,coin:row.coin,network:row.network};
  }else{
   const row=(await query("SELECT o.gross_amount::text,o.net_amount::text,o.coin,o.network,o.escrow_hold_days,o.details,o.status,o.payment_method,coalesce(o.details->>'store_name',s.personal_catalog->>'name',s.name) AS name,s.slug,s.seller_usdc_wallet,coalesce(nullif(s.seller_email,''),sub.email) AS seller_email,sub.language AS seller_language FROM orders o JOIN shops s ON s.id=o.shop_id LEFT JOIN subscriptions sub ON sub.owner_key=s.owner_key WHERE o.id=$1::uuid",[id]))[0];
   if(!row||(kind==='held'&&row.status!=='held')||(kind==='delivered'&&!['held','released','fulfilled'].includes(row.status))||(kind==='seller_held'&&row.status!=='held')||(kind==='released'&&row.status!=='released')||(kind.startsWith('cod_')&&row.payment_method!=='COD')||(kind==='dispute'&&row.status!=='disputed'))return;
   const details=row.details||{},fulfillment=details.fulfillment||{};
   const seller=['seller_held','released','cod_seller'].includes(kind);
   to=emailAddress(kind==='dispute'?process.env.ADMIN_NOTIFY_EMAIL:seller?row.seller_email:details.buyer?.contact);
   data={kind,id,store:row.name,slug:row.slug,language:kind==='dispute'?(process.env.ADMIN_NOTIFY_LANGUAGE||'en'):seller?(row.seller_language||details.language):details.language,amount:kind==='released'?row.net_amount:row.gross_amount,coin:row.coin,network:row.network,days:row.payment_method==='COD'?undefined:row.escrow_hold_days,wallet:seller?(details.seller_wallet||row.seller_usdc_wallet):undefined,status:kind==='delivered'?(fulfillment.status||row.status):row.status,...(kind.startsWith('cod_')?{notes:[...(details.items||[]).map((item:{name:string;quantity:number})=>item.name+' × '+item.quantity),details.buyer?.name,details.buyer?.contact,details.buyer?.phone,details.delivery_note].filter(Boolean).join('\n')}:{}),...(kind==='delivered'?{tracking:fulfillment.tracking,carrier:fulfillment.carrier,notes:[fulfillment.delivery_notes,...(details.digital_items||[]).map((item:{name:string;note:string;download_url:string})=>[item.name,item.note,item.download_url].filter(Boolean).join('\n'))].filter(Boolean).join('\n\n')}:{}),...(kind==='held'?{notes:(details.digital_items||[]).map((item:{name:string;note:string;download_url:string})=>[item.name,item.note,item.download_url].filter(Boolean).join('\n')).join('\n\n')}:{}),...(kind==='dispute'?{reason:details.dispute?.reason}:{})};
   if(kind==='delivered')event+=':'+createHash('sha256').update(JSON.stringify([fulfillment.tracking,fulfillment.delivery_notes,fulfillment.carrier,fulfillment.updated_at])).digest('hex');
  }
  if(!to||!data)return;
  const existing=await query('SELECT event_key FROM transactional_email_deliveries WHERE event_key=$1',[event]);if(existing.length)return;
  const result=await sendEmail(to,data,event,request);
  if(result==='sent')await query('INSERT INTO transactional_email_deliveries(event_key) VALUES($1) ON CONFLICT DO NOTHING',[event]);
  else if(result==='failed')console.warn('SellPostly notification delivery failed; business update remains saved.');
 }catch{console.warn('SellPostly notification unavailable; business update remains saved.');}
}
