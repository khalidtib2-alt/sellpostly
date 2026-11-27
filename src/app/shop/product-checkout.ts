import type {StockVariant} from './inventory-data';
import {cartTotal,checkoutItem,cartLineName} from './cart-data';
import type {Product} from './shop-data';
export function productCheckout(product:Product,quantity:number,variant?:StockVariant){
 const count=Math.min(99,Math.max(1,Math.trunc(quantity)||1));
 const total=cartTotal([{product,quantity:count}]);
 return {product:{...product,price:total?total.amount+' '+total.currency:product.price},details:cartLineName({product,quantity:count,variant})+' × '+count+' — '+product.price,items:[checkoutItem({product,quantity:count,variant})]};
}
