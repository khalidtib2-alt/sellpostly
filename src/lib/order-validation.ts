import {variantLabel,type OrderItem,type StockVariant} from '../app/shop/inventory-data';
import { stableAmount, cryptoNetworks, type CryptoNetwork } from '../app/shop/crypto-data';
import type { Product } from '../app/shop/shop-data';
export class ApiError extends Error { constructor(public code:string,public status=400){super(code);} }
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError('INVALID_INPUT');return value as Record<string,unknown>;}
export function text(value:unknown,max:number,required=true){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new ApiError('INVALID_INPUT');return value.trim();}
export function uuid(value:unknown){const id=text(value,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new ApiError('INVALID_INPUT');return id;}
export function contact(value:unknown){const v=text(value,254);if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return v.toLowerCase();const phone=v.replace(/[\s()+.-]/g,'');if(/^\+?\d{8,15}$/.test(phone))return phone.replace(/^\+/,'');throw new ApiError('INVALID_CONTACT');}
export function coin(value:unknown):'USDC'|'USDT'{if(value!=='USDC'&&value!=='USDT')throw new ApiError('INVALID_INPUT');return value;}
export function network(value:unknown):CryptoNetwork{if(!cryptoNetworks.includes(value as CryptoNetwork))throw new ApiError('INVALID_INPUT');return value as CryptoNetwork;}
export function txId(value:unknown,net:CryptoNetwork){const v=text(value,100);if(net==='Solana'){if(!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(v))throw new ApiError('INVALID_TX');return v;}if(!/^0x[0-9a-fA-F]{64}$/.test(v))throw new ApiError('INVALID_TX');return v.toLowerCase();}
export function units(value:unknown){const v=text(value,21);if(!/^\d{1,14}(?:\.\d{1,6})?$/.test(v))throw new ApiError('INVALID_AMOUNT');return BigInt(v.split('.')[0])*BigInt(1000000)+BigInt((v.split('.')[1]||'').padEnd(6,'0'));}
export function decimal(value:bigint){return (value/BigInt(1000000)).toString()+'.'+(value%BigInt(1000000)).toString().padStart(6,'0');}
export function resolveOrderLines(products:Product[],value:unknown,checkStock=true){
 if(!Array.isArray(value)||!value.length||value.length>50)throw new ApiError('INVALID_ITEMS');
 const quantities=new Map<string,{product:Product;variant?:StockVariant;quantity:number}>();
 for(const item of value){
  const raw=object(item),id=text(raw.id,100),quantity=Number(raw.quantity);
  if(!Number.isInteger(raw.quantity)||quantity<1||quantity>99)throw new ApiError('INVALID_ITEMS');
  const product=products.find(p=>p.id===id);
  if(!product)throw new ApiError('INVALID_ITEMS');
  const variantId=raw.variantId===undefined?'':text(raw.variantId,80);
  const variant=product.variants?.find(row=>row.id===variantId);
  if((variantId||product.variants?.length)&&!variant)throw new ApiError('INVALID_VARIANT',409);
  const key=JSON.stringify([id,variantId]),total=(quantities.get(key)?.quantity||0)+quantity;
  if(total>99)throw new ApiError('INVALID_ITEMS');
  const stock=variant?.stockCount??product.stock;
  if(checkStock&&stock!==undefined&&total>stock)throw new ApiError('OUT_OF_STOCK',409);
  quantities.set(key,{product,variant,quantity:total});
 }
 return [...quantities.values()];
}
export function orderLineItem(product:Product,quantity:number,variant?:StockVariant):OrderItem & {name:string;variantLabel?:string;sku?:string;size?:string;color?:string}{
 return {id:product.id,name:product.name,quantity,...(variant?{variantId:variant.id,variantLabel:variantLabel(variant),sku:variant.sku,size:variant.size,color:variant.color}:{})};
}
export function priceItems(products:Product[],value:unknown,selectedCoin:'USDC'|'USDT',checkStock=true){
 let gross=BigInt(0);
 const items=resolveOrderLines(products,value,checkStock).map(({product,quantity,variant})=>{
  const parsed=stableAmount(product.price);if(!parsed||(parsed.coin&&parsed.coin!==selectedCoin))throw new ApiError('PRICE_UNAVAILABLE');
  const amount=units(parsed.amount);gross+=amount*BigInt(quantity);
  return {...orderLineItem(product,quantity,variant),unit_price:decimal(amount),line_total:decimal(amount*BigInt(quantity))};
 });
 if(gross<=BigInt(0)||gross>=BigInt("100000000000000000000"))throw new ApiError('INVALID_AMOUNT');
 return {items,gross:decimal(gross)};
}
