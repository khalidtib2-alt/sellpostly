import { stableAmount } from "./crypto-data";
import {variantLabel,type OrderItem,type StockVariant} from "./inventory-data";
import type { Product } from "./shop-data";
export type CartLine = { product: Product; quantity: number; variant?:StockVariant; key?:string };
export function cartTotal(lines: CartLine[]) {
  if(!lines.length)return null;
  let total=BigInt(0);
  let coin="";
  for(const {product,quantity} of lines){
    const parsed=stableAmount(product.price);
    if(!parsed||!Number.isInteger(quantity)||quantity<1||quantity>99)return null;
    if(parsed.coin && coin && parsed.coin!==coin)return null;
    if(parsed.coin)coin=parsed.coin;
    const [whole,fraction=""]=parsed.amount.split(".");
    total+=(BigInt(whole)*BigInt(1000000)+BigInt(fraction.padEnd(6,"0")))*BigInt(quantity);
  }
  const whole=total/BigInt(1000000);
  const fraction=(total%BigInt(1000000)).toString().padStart(6,"0").replace(/0+$/,"");
  return {amount:whole.toString()+(fraction?"."+fraction:""),currency:coin||"USD"};
}

export const cartLineKey = (id:string,variantId?:string) => variantId ? JSON.stringify([id,variantId]) : id;

export function catalogCartKeys(products:Product[]) {
 return products.flatMap(product=>[product.id,...(product.variants||[]).map(variant=>cartLineKey(product.id,variant.id))]);
}

export function catalogCartLines(products:Product[],cart:Record<string,number>):CartLine[] {
 const lines:CartLine[]=[];
 for(const product of products){
  if(cart[product.id]>0)lines.push({product,quantity:cart[product.id],key:product.id});
  for(const variant of product.variants||[]){
   const key=cartLineKey(product.id,variant.id);
   if(cart[key]>0)lines.push({product,variant,quantity:cart[key],key});
  }
 }
 return lines;
}
export const checkoutItem=({product,quantity,variant}:CartLine):OrderItem=>({id:product.id,quantity,...(variant?{variantId:variant.id}:{})});
export const cartLineName=({product,variant}:CartLine)=>variant?product.name+' ('+variantLabel(variant)+')':product.name;
export const cartLineAvailable=({product,variant,quantity}:CartLine)=>
 (!product.variants?.length||!!variant)&&quantity<=(variant?.stockCount??product.stock??99);

export function moveCartVariant(cart:Record<string,number>,line:CartLine,id:string){
 const key=cartLineKey(line.product.id,id),old=line.key||line.product.id;
 if(key===old)return cart;
 const stock=line.product.variants?.find(variant=>variant.id===id)?.stockCount||0;
 const total=(cart[key]||0)+(cart[old]||0);
 if(total>Math.min(99,stock))return cart;
 const next={...cart,[key]:total};
 delete next[old];
 return next;
}
