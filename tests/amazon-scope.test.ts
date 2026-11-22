import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {isAmazonDestination,amazonAffiliateProduct} from '../src/app/shop/affiliate-compliance';
import {normalizePending,pendingProduct} from '../src/lib/shop-handoff';

const cdn='https://m.media-amazon.com/images/product.jpg',merchant='https://images.merchant.example/product.jpg';
const product={id:'p',name:'Kids athletic sneakers',price:'$49.99',category:'Fashion',gender:'kids',image:cdn,url:'https://amazon.com/dp/B012345678',compareAtPrice:'$69.99',badge:'sale'};

test('Amazon restrictions apply only in Affiliate mode; ordinary affiliate and Personal images/prices survive saves and shares',async()=>{
 const amazon=validateShop({shopMode:'affiliate',products:[product]}).products[0];assert.equal(amazon.image,cdn);assert.equal(amazon.amazonImageBlocked,false);
 for(const url of ['https://ebay.com/item/1','https://www.etsy.com/listing/1','https://aliexpress.com/item/1','https://merchant.example/p?affiliate=1']){
  const shop=validateShop({shopMode:'affiliate',products:[{...product,url,image:merchant}]});assert.equal(shop.products[0].image,merchant);assert.equal(shop.products[0].price,product.price);assert.equal(amazonAffiliateProduct(shop.products[0]),false);
  assert.equal((await decodeShop(await encodeShop(shop))).products[0].image,merchant);
  assert.equal(validateShop({...shop,products:[{...shop.products[0],image:''}]}).products[0].image.startsWith('/stock-photos/'),true);
 }
 const personal=validateShop({refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',products:[product]}).products[0];assert.equal(personal.image,cdn);assert.equal(personal.price,product.price);assert.equal(personal.amazonImageBlocked,false);
 for(const url of ['https://amzn.to/p','https://amzn.eu/p','https://amazon.co.uk/p'])assert.equal(isAmazonDestination(url),true);
 for(const url of ['https://amzn.eu.evil.example/p','https://notamazon.com/p'])assert.equal(isAmazonDestination(url),false);
 const reusedCdn=validateShop({shopMode:'affiliate',products:[{...product,url:'https://merchant.example/p'}]}).products[0];assert.equal(reusedCdn.amazonImageBlocked,false);assert.equal(reusedCdn.image,cdn);assert.equal(amazonAffiliateProduct(reusedCdn),true);
 // A seller may deliberately use a stock photo on an unrelated affiliate item without auto-replacement.
 const manual=validateShop({shopMode:'affiliate',products:[{...amazon,url:'https://merchant.example/p',amazonImageBlocked:false,name:'New product title'}]}).products[0];assert.equal(manual.image,amazon.image);assert.equal(amazonAffiliateProduct(manual),true);
});

test('extension preserves merchant and Personal Amazon photos, strips only Affiliate CDN photos, and bridges CDN provenance',async()=>{
 let listener:any,bridged:any;const context=vm.createContext({URL,URLSearchParams,importScripts:()=>{},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},chrome:{runtime:{id:'extension',onMessage:{addListener:(fn:any)=>{listener=fn;}}},tabs:{create:async()=>({id:1})},scripting:{executeScript:async({args}:{args:any[]})=>{bridged=args[0];return [{result:true}];}}}});
 for(const file of ['affiliate-guard.js','unbranded-query.js','background.js'])vm.runInContext(await readFile('chrome-extension/'+file,'utf8'),context);
 for(const [destination,url,image,blocked] of [
  ['affiliate','https://amazon.com/dp/B012345678?tag=ours-20',cdn,false],
  ['affiliate','https://www.etsy.com/listing/1',merchant,false],
  ['personal','https://amazon.com/dp/B012345678',cdn,false],
  ['affiliate','https://merchant.example/p',cdn,false],
 ] as const){
  const result:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{...product,title:product.name,destination,url,image}},{id:'extension'},resolve));assert.equal(result.ok,true);assert.equal(bridged.image,blocked?'':image);assert.equal(bridged.price,product.price);assert.equal(bridged.amazonImageBlocked,blocked);
  const incoming=pendingProduct(normalizePending(bridged));const saved=validateShop({shopMode:destination,products:[incoming]}).products[0];assert.equal(saved.price,product.price);if(blocked){assert.ok(saved.image.startsWith('/stock-photos/'));assert.equal(saved.amazonImageBlocked,true);}else assert.equal(saved.image,image);
 }
});

test('public storefront HTML hides prices only for Amazon-related Affiliate cards',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Store from './src/app/shop/shop-builder.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const p=${JSON.stringify(product)};const render=(mode,item)=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Store,{initialShop:{name:'Store',bio:'',phone:'',shopMode:mode,shopTheme:'white',products:[item]},isSharedBuyerView:true,publicSlug:'seller'})));
 const amazon=render('affiliate',p);assert.ok(!amazon.includes('$49.99'));assert.ok(amazon.includes('media-amazon.com'));assert.ok(amazon.includes('Check Price on Amazon'));
 const other=render('affiliate',{...p,url:'https://etsy.com/listing/1',image:'${merchant}'});assert.ok(other.includes('$49.99'));assert.ok(other.includes('${merchant}'));assert.ok(other.includes('View Best Deal'));
 const personal=render('personal',p);assert.ok(personal.includes('$49.99'));assert.ok(personal.includes('${cdn}'));assert.ok(personal.includes('Add to Cart'));
 const reused=render('affiliate',{...p,url:'https://merchant.example/p'});assert.ok(!reused.includes('$49.99'));assert.ok(reused.includes('View Best Deal'));assert.ok(!reused.includes('Check Price on Amazon'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
