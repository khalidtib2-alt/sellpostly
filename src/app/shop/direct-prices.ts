import type {Product} from './shop-data';
export function directPrice(value:string){
 const m=value.trim().match(/^(?:(USD|USDC|USDT|EUR|GBP|MAD|AED|SAR|\$|€|£)\s*)?(\d+(?:\.\d{1,6})?)\s*(USD|USDC|USDT|EUR|GBP|MAD|AED|SAR)?$/i);if(!m)return null;
 const map:Record<string,string>={'$':'USD','€':'EUR','£':'GBP'},a=map[m[1]]||m[1]?.toUpperCase(),b=m[3]?.toUpperCase();if(a&&b&&a!==b)return null;
 const [whole,fraction='']=m[2].split('.');if(whole.length>14)return null;const amount=BigInt(whole)*BigInt(1000000)+BigInt(fraction.padEnd(6,'0'));return amount>BigInt(0)?{amount,currency:b||a||'USD'}:null;
}
export function decimalMoney(n:bigint){return (n/BigInt(1000000)).toString()+'.'+(n%BigInt(1000000)).toString().padStart(6,'0');}
export function directTotal(lines:{product:Product;quantity:number}[]){if(!lines.length)return null;let total=BigInt(0),currency='';for(const {product,quantity} of lines){const price=directPrice(product.price);if(!price||!Number.isInteger(quantity)||quantity<1||quantity>99||(currency&&price.currency!==currency))return null;currency=price.currency;total+=price.amount*BigInt(quantity);}if(total>=BigInt(100000000000000000000))return null;return {amount:decimalMoney(total),currency};}
