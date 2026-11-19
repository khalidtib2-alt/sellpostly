import {cartTotal} from './cart-data';
import type {Product} from './shop-data';
export function productCheckout(product:Product,quantity:number){
 const count=Math.min(99,Math.max(1,Math.trunc(quantity)||1));
 const total=cartTotal([{product,quantity:count}]);
 return {product:{...product,price:total?total.amount+' '+total.currency:product.price},details:product.name+' × '+count+' — '+product.price,items:[{id:product.id,quantity:count}]};
}
