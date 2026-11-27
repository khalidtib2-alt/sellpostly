import type {Language} from '../language-context';
export const customerTags=['vip','repeat','confirm'] as const;
export type CustomerTag=typeof customerTags[number];
export type MoneyTotal={currency:string;amount:string};
export type SaleLine={id:string;name:string;quantity:number;variantId?:string;variantLabel?:string;size?:string;color?:string;sku?:string;unit_price:string;line_total:string};
export type Sale={
 id:string;shop_id:string;store_name:string;invoice_number:string;source:'manual'|'storefront';status:string;
 payment_method:string;coin:string;gross_amount:string;shipping_amount:string;discount_amount:string;created_at:string;
 details:{items?:SaleLine[];buyer?:{name?:string;phone?:string;contact?:string;city?:string};delivery_note?:string;manual_paid?:boolean;manual_method?:string;channel?:string;visitor_id?:string;inventory_returned_at?:string};
};
export type Customer={key:string;shopId:string;shopName:string;name:string;phone:string;email:string;city:string;orders:number;spent:MoneyTotal[];lastOrder:string;lastOrderId:string;preferred:'cod'|'online'|'cash';tags:CustomerTag[];note:string};
export type BackOfficePlan='free'|'pro'|'b2b';

export function followUpLink(phone:string,name:string,language:Language){
 const destination=phone.replace(/\D/g,'');
 if(destination.length<8||destination.length>15)return '';
 const message={
  en:`Hi ${name}, I’m following up on your order. Please let me know if you need anything.`,
  fr:`Bonjour ${name}, je vous contacte au sujet de votre commande. N’hésitez pas si vous avez une question.`,
  es:`Hola ${name}, te escribo para dar seguimiento a tu pedido. Avísame si necesitas algo.`,
  ar:`مرحبًا ${name}، أتابع معك طلبك. أخبرني إذا كنت بحاجة إلى أي مساعدة.`,
 }[language];
 return 'https://wa.me/'+destination+'?text='+encodeURIComponent(message);
}

export function officeMoney(language:Language,value:string,currency:string){
 const options:Intl.NumberFormatOptions={maximumFractionDigits:6};
 if(/^[A-Z]{3}$/.test(currency))return new Intl.NumberFormat(language,{...options,style:'currency',currency}).format(Number(value));
 return new Intl.NumberFormat(language,options).format(Number(value))+' '+currency;
}
