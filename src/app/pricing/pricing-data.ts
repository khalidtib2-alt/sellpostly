import type {Metadata} from 'next';
import {productShareUrl} from '../shop/product-links';
import {translations,type Message} from '../translations';
export const proUpgradeHref='/shop?upgrade=pro';
export const freeFeatures=['1 Primary Personal Store','1 Primary Affiliate Deals Shop','Chrome Extension product imports','Amazon affiliate compliance guardrails','All 8 peer-to-peer payment methods','Browser-based /tools Media Studio'] as const;
export const proFeatures=['Everything in Free','Up to 10 Specialty Niche Stores','Mix Personal and Affiliate niche shops','Toggleable links to your matching Main Store','Independent custom branding for each niche shop','Priority support'] as const;
export const pricingPaymentMethods=['Bank Transfer (IBAN / RIB)','Pay by Card (External Checkout)','PayPal','Payoneer','Wise','USDC','TRON (USDT-TRC20)','Cash on Delivery (COD)'] as const;
export function monthlyProPrice(configured:string|undefined){const value=configured||'15';return /^\d{1,6}(\.\d{1,2})?$/.test(value)&&Number(value)>0?value:null;}
export function pricingMetadata(language:'en'|'fr'|'ar'='en'):Metadata{
 const tr=(s:Message)=>language==='en'?s:translations[s][language];
 const title=tr('Free & Pro Pricing | SellPostly'),description=tr('Compare two free primary storefronts with Pro specialty niche stores, browser media tools and direct seller payment options.');
 const url=productShareUrl('/pricing'),image=productShareUrl('/opengraph-image');
 return {title,description,alternates:{canonical:url},openGraph:{type:'website',siteName:'SellPostly',url,title,description,locale:language==='fr'?'fr_FR':language==='ar'?'ar_MA':'en_US',images:[{url:image,width:1200,height:630,alt:'SellPostly'}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
