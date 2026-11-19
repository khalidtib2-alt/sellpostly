import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {productPath,productShareUrl,cartStorageKey,normalizeCart} from '../src/app/shop/product-links';
import {cartTotal} from '../src/app/shop/cart-data';
test('personal product routes safely encode IDs and preserve shared storefront snapshots',()=>{
 assert.equal(productPath('id/with ?','seller-one'),'/s/seller-one/product/id%2Fwith%20%3F');
 assert.equal(productPath('local-id'),'/shop/p/local-id');
 const link=productPath('snapshot-id',undefined,'snapshot+token');assert.equal(new URL(link,'https://shop.example').searchParams.get('s'),'snapshot+token');
 assert.equal(new URL(productShareUrl(productPath('id','seller-one'))).pathname,'/s/seller-one/product/id');
 assert.notEqual(new URL(productShareUrl('/s/seller/product/id')).hostname,'vercel.app');
 assert.notEqual(cartStorageKey('local'),cartStorageKey());
 assert.notEqual(cartStorageKey('store-one'),cartStorageKey('store-two'));
 assert.notEqual(cartStorageKey(undefined,'catalog-a'),cartStorageKey(undefined,'catalog-b'));
});
test('carts persist only valid product quantities and retain exact checkout totals',()=>{
 const saved=JSON.stringify({a:2,b:500,deleted:2,c:-1,d:1.5});
 const cart=normalizeCart(JSON.parse(saved),['a','b','c','d']);assert.deepEqual(cart,{a:2,b:99});
 const make=(id:string,price:string)=>({id,name:id,price,category:'Other',gender:'unisex' as const,image:'',url:'',source:'Other'});
 assert.deepEqual(cartTotal([{product:make('a','0.10 USD'),quantity:3},{product:make('b','0.20 USD'),quantity:2}]),{amount:'0.7',currency:'USD'});
 assert.deepEqual(normalizeCart(null,['a']),{});assert.deepEqual(normalizeCart(['a'],['a']),{});
});
test('gallery photos survive validation and compressed links while unsafe URLs are removed',async()=>{
 const input={name:'Store',shopMode:'personal',products:[{id:'id',name:'Product',price:'12 USD',image:'https://img.example/main.jpg',images:['https://img.example/second.jpg','javascript:alert(1)','https://img.example/third.jpg'],category:'Fashion',gender:'kids'}]};
 const shop=validateShop(input);assert.deepEqual(shop.products[0].images,['https://img.example/second.jpg','https://img.example/third.jpg']);
 const decoded=await decodeShop(await encodeShop(shop));assert.deepEqual(decoded.products[0].images,shop.products[0].images);
 assert.equal(validateShop({...input,shopMode:'affiliate'}).shopMode,'affiliate');
 assert.equal(validateShop({...input,products:[{...input.products[0],images:Array.from({length:20},(_,i)=>'https://img.example/'+i+'.jpg')}]}).products[0].images?.length,8);
});

