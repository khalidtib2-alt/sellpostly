import type {Shop} from './shop-data';
import {cartTotal,cartLineName,type CartLine} from './cart-data';
export function codMessage(shop:Shop,lines:CartLine[],buyer:{name:string;phone:string;address:string},labels:{heading:string;buyer:string;phone:string;address:string;total:string;confirm:string}){
 const total=cartTotal(lines);
 return [labels.heading,shop.name,...lines.map(line=>cartLineName(line)+' × '+line.quantity+' — '+line.product.price),labels.total+': '+(total?total.amount+' '+total.currency:labels.confirm),labels.buyer+': '+buyer.name,labels.phone+': '+buyer.phone,labels.address+': '+buyer.address].join('\n');
}
