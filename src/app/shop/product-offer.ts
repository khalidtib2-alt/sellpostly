import {directPrice} from './direct-prices';
import type {Product} from './shop-data';
export function productSavings(product:Product){
 const now=directPrice(product.price),raw=product.compareAtPrice?.trim();if(!now||!raw)return null;
 const before=directPrice(/^\d+(?:\.\d+)?$/.test(raw)?raw+' '+now.currency:raw);
 if(!before||before.currency!==now.currency||before.amount<=now.amount)return null;
 const amount=before.amount-now.amount,percent=Number(amount*BigInt(100)/before.amount);return {percent,amount:Number(amount)/1000000,currency:now.currency};
}
