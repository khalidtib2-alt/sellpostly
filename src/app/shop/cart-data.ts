import { stableAmount } from "./crypto-data";
import type { Product } from "./shop-data";
export type CartLine = { product: Product; quantity: number };
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
