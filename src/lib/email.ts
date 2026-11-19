import 'server-only';
import {locale,type Locale} from './locale';
import {publicLink} from './public-url';
export type EmailKind='pro'|'held'|'delivered'|'dispute'|'payout';
export type EmailData={kind:EmailKind;language?:unknown;id:string;store?:string;slug?:string;amount?:string;coin?:string;network?:string;days?:number;key?:string;tracking?:string;notes?:string;reason?:string};
const copy={
 en:{pro:'Your SellPostly Pro license is ready',held:'Payment verified — escrow protection active',delivered:'Your digital key or tracking details',dispute:'Buyer dispute opened',payout:'Your seller payout is marked paid',intro:'Here are the details of your SellPostly update.',id:'Reference ID',order:'Order ID',store:'Store',amount:'Amount',network:'Network',hold:'Escrow protection (days)',key:'Pro License Key',tracking:'Tracking / Delivery Reference',notes:'Digital Key / Delivery Notes',reason:'Dispute Reason',open:'View in SellPostly',footer:'Keep this message private. SellPostly will never ask for your wallet private key.'},
 fr:{pro:'Votre licence SellPostly Pro est prête',held:'Paiement vérifié — protection sous séquestre active',delivered:'Votre clé numérique ou vos informations de suivi',dispute:'Un acheteur a ouvert un litige',payout:'Votre retrait vendeur est marqué comme payé',intro:'Voici les détails de votre mise à jour SellPostly.',id:'Identifiant de référence',order:'Numéro de commande',store:'Boutique',amount:'Montant',network:'Réseau',hold:'Protection sous séquestre (jours)',key:'Clé de licence Pro',tracking:'Référence de suivi / livraison',notes:'Clé numérique / instructions de livraison',reason:'Motif du litige',open:'Voir dans SellPostly',footer:'Gardez ce message privé. SellPostly ne vous demandera jamais la clé privée de votre portefeuille.'},
 ar:{pro:'مفتاح ترخيص SellPostly Pro جاهز',held:'تم التحقق من الدفع وتفعيل حماية الضمان',delivered:'مفتاحك الرقمي أو تفاصيل تتبع الشحنة',dispute:'فتح المشتري نزاعاً',payout:'تم تسجيل دفعة سحب البائع على أنها مدفوعة',intro:'إليك تفاصيل آخر تحديث من SellPostly.',id:'المعرّف المرجعي',order:'رقم الطلب',store:'المتجر',amount:'المبلغ',network:'الشبكة',hold:'فترة حماية الضمان بالأيام',key:'مفتاح ترخيص Pro',tracking:'مرجع التتبع أو التسليم',notes:'المفتاح الرقمي أو ملاحظات التسليم',reason:'سبب النزاع',open:'عرض في SellPostly',footer:'احتفظ بهذه الرسالة بشكل خاص. لن يطلب منك SellPostly أبداً المفتاح الخاص لمحفظتك.'}
};
export function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function emailTemplate(data:EmailData){
 const lang:Locale=locale(data.language),words=copy[lang];
 const fields:[string,string|number|undefined][]=[[['held','delivered','dispute'].includes(data.kind)?words.order:words.id,data.id],[words.store,data.store],[words.amount,data.amount?data.amount+' '+(data.coin||'') :undefined],[words.network,data.network],[words.hold,data.days],[words.key,data.key],[words.tracking,data.tracking],[words.notes,data.notes],[words.reason,data.reason]];
 const visible=fields.filter(([,value])=>value!==undefined&&value!=='');
 const href=publicLink(data.kind==='pro'?'/shop':data.kind==='payout'?'/dashboard':data.kind==='dispute'?'/admin':'/s/'+encodeURIComponent(data.slug||''));
 const text=[words[data.kind],words.intro,...visible.map(([label,value])=>label+': '+value),words.open+': '+href,words.footer].join('\n\n');
 const rows=visible.map(([label,value])=>'<tr><th style="text-align:start;padding:10px;border-bottom:1px solid #e2e8f0">'+escapeHtml(label)+'</th><td dir="auto" style="padding:10px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap;overflow-wrap:anywhere">'+escapeHtml(value)+'</td></tr>').join('');
 const html='<!doctype html><html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'"><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><main style="max-width:600px;margin:24px auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:28px"><p style="font-weight:bold;color:#059669">SellPostly</p><h1 style="font-size:24px">'+escapeHtml(words[data.kind])+'</h1><p>'+escapeHtml(words.intro)+'</p><table style="width:100%;border-collapse:collapse">'+rows+'</table><p style="margin-top:28px"><a style="display:inline-block;background:#047857;color:white;padding:12px 20px;border-radius:8px;text-decoration:none" href="'+escapeHtml(href)+'">'+escapeHtml(words.open)+'</a></p><p style="font-size:12px;color:#475569">'+escapeHtml(words.footer)+'</p></main></body></html>';
 return {subject:words[data.kind],html,text};
}
export function emailAddress(value:unknown){return typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)?value.trim():null;}
export async function sendEmail(to:string,data:EmailData,eventKey:string,request:typeof fetch=fetch):Promise<'sent'|'failed'|'skipped'>{
 const apiKey=process.env.RESEND_API_KEY?.trim();if(!apiKey||!emailAddress(to))return 'skipped';
 try{
  const response=await request('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':eventKey},body:JSON.stringify({from:process.env.EMAIL_FROM||'SellPostly <onboarding@resend.dev>',to:[to],...emailTemplate(data)}),signal:AbortSignal.timeout(5000),cache:'no-store'});
  if(!response.ok)return 'failed';const result=await response.json();return typeof result.id==='string'?'sent':'failed';
 }catch{return 'failed';}
}

