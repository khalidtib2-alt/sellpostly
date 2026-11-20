import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {validateShop,encodeShop,decodeShop,shopKey} from '../src/app/shop/shop-data';
import {modeCatalogKey,switchCatalog} from '../src/app/shop/catalog-modes';
import {consumePending,normalizePending,pendingShopKey} from '../src/lib/shop-handoff';
import {dealDiscount,productHighlights} from '../src/app/shop/storefront-style';
import {priceItems} from '../src/lib/order-validation';
import {translations} from '../src/app/translations';
function memory(){const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};}
test('hero, palette, surface and stock survive separate catalog switching and compressed links',async()=>{
 const affiliate=validateShop({name:'Deals',shopMode:'affiliate',heroTitle:'Curated by us',heroImage:'https://img.example/hero.jpg',shopAccent:'amber',shopTheme:'sand',products:[{id:'deal',name:'Deal',price:'20 USD',compareAtPrice:'40 USD',stock:5}]});
 const db=memory();let personal=switchCatalog(affiliate,'personal',db);assert.equal(personal.shopAccent,'emerald');assert.equal(personal.heroTitle,'');assert.equal(personal.products.length,0);
 personal={...personal,heroTitle:'Our brand',shopAccent:'violet',shopTheme:'slate'};
 const restored=switchCatalog(personal,'affiliate',db);assert.equal(restored.heroTitle,'Curated by us');assert.equal(restored.shopAccent,'amber');assert.equal(restored.shopTheme,'sand');
 const other=switchCatalog(restored,'personal',db);assert.equal(other.heroTitle,'Our brand');assert.equal(other.shopAccent,'violet');assert.equal(other.shopTheme,'slate');
 const shared=await decodeShop(await encodeShop(restored));assert.equal(shared.heroImage,affiliate.heroImage);assert.equal(shared.products[0].stock,5);
 assert.equal(validateShop({...affiliate,heroImage:'javascript:alert(1)',shopAccent:'invalid'}).heroImage,'');
});
test('destination imports preserve affiliate tags and both catalogs, including repeated handoffs',()=>{
 const db=memory(),personal=validateShop({name:'Brand',shopMode:'personal',shopAccent:'rose',heroTitle:'Our pieces',products:[{id:'own',name:'Owned',price:'15 USD'}]});
 db.setItem(modeCatalogKey('affiliate'),JSON.stringify(validateShop({shopMode:'affiliate',shopAccent:'amber',products:[{id:'old-deal',name:'Old deal'}]})));
 const item=normalizePending({id:'imported',destination:'affiliate',stock:7,title:'Headphones',url:'https://amazon.com/dp/B012345678?tag=ourshop-20',price:'25 USD'});
 db.setItem(pendingShopKey,JSON.stringify(item));const result=consumePending(personal,db);assert.equal(result.shop.shopMode,'affiliate');assert.equal(result.shop.products[0].url,item.url);assert.equal(result.shop.products[0].stock,7);
 assert.deepEqual(JSON.parse(db.getItem(modeCatalogKey('personal'))!).products.map((p:any)=>p.id),['own']);
 assert.equal(JSON.parse(db.getItem(shopKey)!).shopMode,'affiliate');assert.equal(db.getItem(pendingShopKey),null);
 db.setItem(pendingShopKey,JSON.stringify(item));assert.equal(consumePending(result.shop,db).shop.products.length,2);
 db.setItem(pendingShopKey,JSON.stringify({...item,id:'personal-import',destination:'personal'}));const own=consumePending(result.shop,db).shop;assert.equal(own.shopMode,'personal');assert.equal(own.heroTitle,'Our pieces');assert.deepEqual(own.products.map(p=>p.id),['personal-import','own']);assert.ok(own.products.every(p=>p.catalogMode==='personal'));
});
test('extension 1.0.4 bridges destination and stock, preserves affiliate URL parameters, and cleans personal links',async()=>{
 let listener:any,bridged:any;const opened:string[]=[];
 const context=vm.createContext({URL,URLSearchParams,crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},importScripts:()=>{},SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},chrome:{runtime:{id:'extension',onMessage:{addListener:(fn:any)=>{listener=fn;}}},tabs:{create:async({url}:{url:string})=>{opened.push(url);return {id:1};}},scripting:{executeScript:async({args}:{args:any[]})=>{bridged=args[0];return [{result:true}];}}}});
 vm.runInContext(await readFile('chrome-extension/affiliate-guard.js','utf8'),context);vm.runInContext(await readFile('chrome-extension/unbranded-query.js','utf8'),context);vm.runInContext(await readFile('chrome-extension/background.js','utf8'),context);
 const url='https://www.amazon.com/product-name/dp/B012345678?tag=ourshop-20&ascsubtag=summer&utm_source=test';
 for(const destination of ['affiliate','personal']){const result:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{title:'Product',price:'25 USD',url,destination,stock:4}},{id:'extension'},resolve));assert.equal(result.ok,true);assert.equal(bridged.destination,destination);assert.equal(bridged.stock,4);assert.equal(bridged.url,destination==='affiliate'?url:'https://www.amazon.com/dp/B012345678');assert.equal(opened.at(-1),'https://sellpostly.vercel.app/shop');}
 const manifest=JSON.parse(await readFile('chrome-extension/manifest.json','utf8'));assert.equal(manifest.version,'1.0.6');assert.deepEqual(manifest.permissions,['activeTab','scripting','storage']);
 const popup=await readFile('chrome-extension/popup.html','utf8');assert.ok(popup.includes('name="destination"'));assert.ok(popup.includes('value="affiliate"'));assert.ok(popup.includes('value="personal"'));
});
test('discounts reflect compatible prices and stock limits are enforced before checkout',()=>{
 const p=validateShop({shopMode:'personal',products:[{id:'p',name:'P',price:'20 USD',compareAtPrice:'40 USD',stock:2}]}).products[0];
 assert.equal(dealDiscount(p),50);assert.equal(dealDiscount({...p,compareAtPrice:'30 EUR'}),null);assert.equal(dealDiscount({...p,compareAtPrice:'10 USD'}),null);
 assert.deepEqual(productHighlights('Lightweight\n• Adjustable\n✅ Travel ready'),['Lightweight','Adjustable','Travel ready']);
 assert.throws(()=>priceItems([p],[{id:'p',quantity:3}],'USDC'),(error:any)=>error.code==='OUT_OF_STOCK');assert.equal(priceItems([p],[{id:'p',quantity:2}],'USDC').gross,'40.000000');
 for(const key of ['Destination Store','Affiliate Deals Shop','Personal Seller Shop','View Best Deal','Quick View','Template Design','Hero Headline','Stock (Optional)'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
test('public views render distinct templates without affiliate cart/escrow leakage',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Store from './src/app/shop/shop-builder.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const base={name:'Store',bio:'',phone:'',shopTheme:'sand',shopAccent:'amber',products:[{id:'p',name:'Product',price:'20 USD',compareAtPrice:'40 USD',category:'Other',gender:'unisex',image:'/demo-products/headphones.svg',url:'https://amazon.com/dp/TEST?tag=ourshop-20',source:'Amazon',description:'Lightweight\\nAdjustable'}]};
 const render=mode=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Store,{initialShop:{...base,shopMode:mode},isSharedBuyerView:true,publicSlug:'seller'})));
 const aff=render('affiliate');assert.ok(aff.includes('data-template="editorial"'));assert.ok(aff.includes('Check Price on Amazon'));assert.ok(aff.includes('tag=ourshop-20'));assert.ok(!aff.includes('50%'));assert.ok(!aff.includes('store-card-price'));for(const text of ['Add to Cart','Pay with USDC','Cash on Delivery','Escrow Buyer Protection','Shopping Bag'])assert.ok(!aff.includes(text),text);
 const own=render('personal');for(const text of ['data-template="boutique"','Quick View','Shopping Bag','Add to Cart','Cash on Delivery','/s/seller/product/p'])assert.ok(own.includes(text),text);assert.ok(!own.includes('https://amazon.com/dp/TEST'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
