import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {switchCatalog} from '../src/app/shop/catalog-modes';
import {socialShareLinks} from '../src/app/shop/share-links';
import {codMessage} from '../src/app/shop/cod-data';
import {productCheckout} from '../src/app/shop/product-checkout';
import {translations} from '../src/app/translations';
import {spawnSync} from 'node:child_process';
const product=(id:string,catalogMode:'personal'|'affiliate')=>({id,name:id,price:'12.50 USD',category:'Fashion',gender:'unisex',image:'',url:'https://amazon.com/dp/EXAMPLE',source:'Other',catalogMode});
const storage=()=>{const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);}};};
test('mode switches archive inventories separately, restore them and never copy affiliate samples into personal stores',()=>{
 const db=storage(),affiliate=validateShop({shopMode:'affiliate',name:'Store',products:[product('affiliate','affiliate')]});
 const personal=switchCatalog(affiliate,'personal',db);assert.equal(personal.products.length,0);
 personal.products.push(product('owned','personal') as typeof personal.products[number]);
 const restored=switchCatalog(personal,'affiliate',db);assert.deepEqual(restored.products.map(p=>p.id),['affiliate']);
 assert.deepEqual(switchCatalog(restored,'personal',db).products.map(p=>p.id),['owned']);
 assert.equal(affiliate.products[0].id,'affiliate');
});
test('validation and shared links exclude products tagged for the other catalog; untagged legacy items stay in their original mode',async()=>{
 const mixed={refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',products:[product('own','personal'),product('deal','affiliate'),{...product('legacy','personal'),catalogMode:undefined}]};
 const shop=validateShop(mixed);assert.deepEqual(shop.products.map(p=>p.id),['own','legacy']);
 assert.ok(shop.products.every(p=>p.catalogMode==='personal'));
 assert.deepEqual((await decodeShop(await encodeShop(shop))).products.map(p=>p.id),['own','legacy']);
 assert.deepEqual(validateShop({...mixed,shopMode:'affiliate'}).products.map(p=>p.id),['deal','legacy']);
});
test('social sharing encodes product URLs and text for all six destinations without executing injected schemes',()=>{
 const url='https://sellpostly.vercel.app/s/a/product/b?x=a%26b',title='Title & special #chars';
 const links=socialShareLinks(url,title);assert.equal(Object.keys(links).length,6);
 assert.equal(new URL(links.Facebook).searchParams.get('u'),url);
 assert.equal(new URL(links.Telegram).searchParams.get('text'),title);
 assert.equal(new URL(links.LinkedIn).searchParams.get('url'),url);
 assert.equal(new URL(links.WhatsApp).searchParams.get('text'),title+'\n'+url);
 assert.match(links.Email,/^mailto:/);assert.throws(()=>socialShareLinks('javascript:alert(1)',title));
});
test('COD receipt and crypto checkout retain the same product quantity and exact total',()=>{
 const shop=validateShop({name:'Seller',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',products:[product('p','personal')]});
 const lines=[{product:shop.products[0],quantity:3}];
 const message=codMessage(shop,lines,{name:'Buyer',phone:'+212600000000',address:'Street 1'},{heading:'COD',buyer:'Buyer',phone:'Phone',address:'Address',total:'Total',confirm:'Confirm'});
 assert.match(message,/Total: 37.5 USD/);assert.match(message,/p × 3/);assert.match(message,/Address: Street 1/);
 assert.equal(productCheckout(shop.products[0],3).product.price,'37.5 USD');
});
test('new checkout and share controls have French and Arabic translations',()=>{
 for(const key of ['Share Store','Share Product','Copy Link','Cash on Delivery (COD)','Confirm COD on WhatsApp','Delivery Address'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
test('buyer rendering enforces affiliate-only external CTA and personal product checkout/gallery controls',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';
 import {LanguageProvider} from './src/app/language-context.tsx';import Store from './src/app/shop/shop-builder.tsx';import Landing from './src/app/shop/product-landing.tsx';
 const item={id:'owned',name:'Product',price:'10 USD',category:'Other',gender:'unisex',image:'https://img.example/p.jpg',url:'https://amazon.com/dp/TEST',source:'Amazon'};
 const shop={name:'Seller',bio:'',phone:'15555555555',shopTheme:'white',shopMode:'affiliate',products:[item]};
 const render=(Component,props)=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Component,props)));
 const affiliate=render(Store,{initialShop:shop,isSharedBuyerView:true,publicSlug:'seller'});
 assert.ok(affiliate.includes("https://amazon.com/dp/TEST"));assert.match(affiliate,/sponsored/);
 for(const forbidden of ['Add to Cart','Pay with USDC','Cash on Delivery','Escrow Protected'])assert.ok(!affiliate.includes(forbidden),forbidden);
 const personal={...shop,refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal'};
 const storefront=render(Store,{initialShop:personal,isSharedBuyerView:true,publicSlug:'seller'});
 assert.ok(storefront.includes("/s/seller/product/owned"));assert.match(storefront,/Add to Cart/);assert.match(storefront,/Cash on Delivery/);
 const landing=render(Landing,{shop:personal,productId:'owned',slug:'seller'});assert.ok(landing.includes('/s/seller/personal')); 
 for(const expected of ['Pay with USDC','Cash on Delivery','Quantity','Open Fullscreen Image','Share Product'])assert.ok(landing.includes(expected),expected);
 assert.ok(!render(Landing,{shop,productId:'owned',slug:'seller'}).includes('Pay with USDC'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stderr||result.stdout);
});


