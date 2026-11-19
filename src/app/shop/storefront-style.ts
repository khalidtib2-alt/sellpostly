import {stableAmount} from './crypto-data';
import type {Product} from './shop-data';
export const shopAccents=['emerald','blue','amber','violet','rose'] as const;
export type ShopAccent=typeof shopAccents[number];
export const shopAccentNames=['Emerald','Ocean Blue','Sunset Amber','Royal Violet','Rose Coral'] as const;
export function dealDiscount(product:Product){
 const current=stableAmount(product.price),original=stableAmount(product.compareAtPrice||'');
 if(!current||!original||current.coin!==original.coin)return null;
 const now=Number(current.amount),before=Number(original.amount);
 return before>now&&now>0?Math.floor((before-now)/before*100)||null:null;
}
export function productHighlights(description=''){
 return description.split(/\n+|[•✅]|(?:[.!?؟]\s+)/).map(line=>line.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0,3).map(line=>line.length>140?line.slice(0,137)+'…':line);
}
