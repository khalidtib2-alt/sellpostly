import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCart,writeCart} from '../src/app/shop/cart-storage';
import {cartStorageKey,legacyCartStorageKey} from '../src/app/shop/product-links';
import {productCheckout} from '../src/app/shop/product-checkout';
const storage=()=>{const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};};
test('product and storefront reads share immediately persisted quantities; empty carts never resurrect legacy items',()=>{
 const db=storage(),key=cartStorageKey('seller'),old=legacyCartStorageKey('seller');
 assert.equal(key,'sellpostly_cart_seller');db.setItem(old,JSON.stringify({a:2,deleted:4}));
 assert.deepEqual(readCart(db,key,['a','b'],old),{a:2});
 writeCart(db,key,{...readCart(db,key,['a','b']),b:3});
 assert.deepEqual(readCart(db,key,['a','b'],old),{a:2,b:3});
 writeCart(db,key,{});assert.deepEqual(readCart(db,key,['a','b'],old),{});
 assert.deepEqual(readCart(db,cartStorageKey('other'),['a','b']),{});
 assert.notEqual(cartStorageKey(),cartStorageKey('preview'));
});
test('cart handles invalid storage and limits stale quantities safely',()=>{
 const db=storage(),key=cartStorageKey('seller');db.setItem(key,'broken');assert.deepEqual(readCart(db,key,['a']),{});
 db.setItem(key,JSON.stringify({a:1000,b:0,c:-1}));assert.deepEqual(readCart(db,key,['a','b','c']),{a:99});
 const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}};
 assert.deepEqual(readCart(blocked,key,['a'],undefined,{a:2}),{a:2});assert.equal(writeCart(blocked,key,{a:2}),false);
});
test('direct product checkout totals selected quantity exactly and sends original item ID',()=>{
 const product={id:'a',name:'Headphones',price:'0.10 USDC',category:'Other',gender:'unisex' as const,image:'',url:'',source:'Other'};
 const checkout=productCheckout(product,3);
 assert.equal(checkout.product.price,'0.3 USDC');assert.deepEqual(checkout.items,[{id:'a',quantity:3}]);
 assert.match(checkout.details,/Headphones/);assert.equal(product.price,'0.10 USDC');
 assert.equal(productCheckout(product,200).items[0].quantity,99);
});
