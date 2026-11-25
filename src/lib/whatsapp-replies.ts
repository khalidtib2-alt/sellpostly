import {locale,type Locale} from './locale';
export function buyerPhone(value:unknown){
 if(typeof value!=='string'||!/^\+?[\d\s().-]+$/.test(value.trim()))return '';
 const number=value.replace(/\D/g,'').replace(/^00/,'');return /^[1-9]\d{7,14}$/.test(number)?number:'';
}
export type ReplyKind='confirmed'|'delivered'|'followup';
const words:Record<Locale,{confirmed:string;delivered:string;followup:string;order:string;store:string;tracking:string;notes:string}>={
 es:{confirmed:'Tu pedido está confirmado. Gracias por comprar con nosotros.',delivered:'Tu clave digital o datos de seguimiento están listos.',followup:'¿Ha llegado tu pedido? Dinos si necesitas ayuda.',order:'ID del pedido',store:'Tienda',tracking:'Seguimiento',notes:'Clave digital o notas de entrega'},
 en:{confirmed:'Your order is confirmed. Thank you for shopping with us.',delivered:'Your digital key / tracking details are ready.',followup:'Has your order arrived? Please let us know if you need help.',order:'Order ID',store:'Store',tracking:'Tracking',notes:'Digital key / delivery notes'},
 fr:{confirmed:'Votre commande est confirmée. Merci pour votre achat.',delivered:'Votre clé numérique / suivi est disponible.',followup:'Votre commande est-elle arrivée ? Dites-nous si vous avez besoin d’aide.',order:'Commande',store:'Boutique',tracking:'Suivi',notes:'Clé numérique / instructions de livraison'},
 ar:{confirmed:'تم تأكيد طلبك. شكراً لتسوقك معنا.',delivered:'مفتاحك الرقمي أو معلومات التتبع جاهزة.',followup:'هل وصلك طلبك؟ أخبرنا إن كنت تحتاج إلى مساعدة.',order:'رقم الطلب',store:'المتجر',tracking:'التتبع',notes:'المفتاح الرقمي أو ملاحظات التسليم'}
};
export function quickReplyUrl(kind:ReplyKind,language:unknown,order:{id:string;details:{buyer?:{contact?:string;phone?:string};fulfillment?:{tracking?:string;delivery_notes?:string}}},store:string,override?:{tracking:string;delivery_notes:string}){
 const phone=buyerPhone(order.details.buyer?.phone)||buyerPhone(order.details.buyer?.contact);if(!phone)return null;
 const copy=words[locale(language)],delivery=override||order.details.fulfillment;
 const text=[copy[kind],copy.order+': '+order.id,copy.store+': '+store,...(kind==='delivered'&&delivery?[delivery.tracking?copy.tracking+': '+delivery.tracking:'',delivery.delivery_notes?copy.notes+': '+delivery.delivery_notes:'']:[])].filter(Boolean).join('\n\n');
 const preview=text.slice(0,800).replace(/[\uD800-\uDBFF]$/,'').trimEnd();
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent(preview);
}

