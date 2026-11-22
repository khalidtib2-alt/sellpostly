import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
import {isAmazonDestination,isAmazonCdnImage,affiliateImage,studioCategoryImage,disclosurePresets,amazonImageNotice} from '../src/app/shop/affiliate-compliance';
import {validateShop} from '../src/app/shop/shop-data';
import {PUBLISH_SHOP_SQL,publicShop,sellerShopSettings} from '../src/lib/db';
import {normalizePending} from '../src/lib/shop-handoff';
import {translations} from '../src/app/translations';
import type {Query} from '../src/lib/order-service';
test('host-based Amazon and image recognition handles regions and rejects lookalikes',()=>{
 for(const url of ['https://amazon.com/dp/x?tag=a','https://www.amazon.co.uk/x','https://amazon.com.be/x','https://amazon.ae/x','https://amazon.co.za/x','https://amzn.to/abc'])assert.equal(isAmazonDestination(url),true,url);
 for(const url of ['https://amazon.com.evil.example/x','https://fakeamazon.com/x','https://evil.example/?url=https://amazon.com','https://amazon.com@evil.example/x','javascript:amazon.com'])assert.equal(isAmazonDestination(url),false,url);
 for(const url of ['https://m.media-amazon.com/images/a.jpg','https://images-na.ssl-images-amazon.com/a.jpg','https://images-amazon.com/a.jpg'])assert.equal(isAmazonCdnImage(url),true,url);
 for(const url of ['https://media-amazon.com.evil.example/a','https://img.example.com/?amazon=media-amazon.com','data:image/png;base64,AAAA','/demo-products/bottle.svg'])assert.equal(isAmazonCdnImage(url),false,url);
 assert.equal(affiliateImage('https://m.media-amazon.com/a.jpg','Fashion'),'https://m.media-amazon.com/a.jpg');assert.equal(studioCategoryImage('Other'),'/demo-products/studio-product.svg');
 const raw={shopMode:'affiliate',heroImage:'https://m.media-amazon.com/hero.jpg',products:[{id:'p',name:'P',category:'Fashion',image:'https://m.media-amazon.com/a.jpg',images:['https://images-amazon.com/b.jpg','https://press.example/authorized.jpg']}]};
 const shop=validateShop(raw);assert.equal(shop.products[0].image,raw.products[0].image);assert.ok(shop.products[0].images?.includes('https://press.example/authorized.jpg'));assert.equal(shop.heroImage,raw.heroImage);
 assert.equal(validateShop({...raw,refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal'}).products[0].image,raw.products[0].image);
});
test('disclosure column migrates idempotently, saves every preset/custom text and survives Personal publishing',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await query("INSERT INTO subscriptions(owner_key,provider) VALUES('disclosure-owner','master')",[]);
  const legacy={shopMode:'affiliate',name:'Store',affiliateDisclosure:'Legacy disclosure',products:[]};
  await query("INSERT INTO shops(owner_key,slug,name,catalog,affiliate_catalog) VALUES('disclosure-owner','disclosure-shop','Store',$1::jsonb,$1::jsonb)",[JSON.stringify(legacy)]);await pg.exec(schema);await pg.exec(schema);
  assert.equal((await sellerShopSettings('disclosure-owner',query)).affiliate_disclosure,'Legacy disclosure');
  for(const text of [...disclosurePresets.map(p=>p.text),'Custom <script>not HTML</script>']){
   await query(PUBLISH_SHOP_SQL,['disclosure-owner','unused-slug','Store','',JSON.stringify({...legacy,affiliateDisclosure:text})]);
   assert.equal((await publicShop('disclosure-shop',query,'affiliate'))?.affiliateDisclosure,text);
   await query(PUBLISH_SHOP_SQL,['disclosure-owner','unused-slug','Own Store','',JSON.stringify({name:'Own Store',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',affiliateDisclosure:'Do not overwrite',products:[]})]);
   assert.equal((await sellerShopSettings('disclosure-owner',query)).affiliate_disclosure,text);
  }
 }finally{await pg.close();}
});
test('public Amazon cards omit static price and discount while non-Amazon cards retain them; disclosure precedes hero',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Store from './src/app/shop/shop-builder.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const item={id:'p',name:'Product',price:'$19.99',compareAtPrice:'$39.99',badge:'sale',category:'Fashion',gender:'unisex',image:'https://m.media-amazon.com/image.jpg',url:'https://amazon.com/dp/ASIN?tag=ourshop-20',source:'Amazon'};
 const render=(products,disclosure='Custom seller disclosure')=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Store,{initialShop:{name:'Store',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',affiliateDisclosure:disclosure,products},isSharedBuyerView:true,publicSlug:'seller'})));
 const html=render([item]);assert.ok(html.includes('Check Price on Amazon'));assert.ok(html.includes('nofollow sponsored noopener'));assert.ok(!html.includes('$19.99'));assert.ok(!html.includes('$39.99'));assert.ok(!html.includes('store-deal-badge'));assert.ok(html.includes('media-amazon.com'));assert.ok(html.includes('https://m.media-amazon.com/image.jpg'));assert.ok(html.includes('tag=ourshop-20'));assert.ok(html.indexOf('Custom seller disclosure')<html.indexOf('data-template="editorial"'));
 const other=render([{...item,url:'https://brand.example/product',image:'https://press.example/photo.jpg'}]);assert.ok(other.includes('$19.99'));assert.ok(other.includes('store-deal-badge'));assert.ok(other.includes('View Best Deal'));
 assert.ok(render([{...item,url:'https://amzn.to/short'}]).includes('Check Price on Amazon'));assert.ok(render([item],'').includes('Disclosure: This storefront contains affiliate links'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('popup reminds without blocking images and worker preserves the original CDN URL',async()=>{
 const guard=await readFile('chrome-extension/affiliate-guard.js','utf8'),popup=await readFile('chrome-extension/popup.js','utf8');
 const values:any={destination:{value:'affiliate'},category:{value:'Fashion'}},preview:any={dataset:{rawImage:'https://m.media-amazon.com/photo.jpg',sourceUrl:'https://amazon.com/dp/EXAMPLE'},getAttribute:()=>null,removeAttribute:()=>{}},notice:any={hidden:true};
 const context=vm.createContext({URL,document:{querySelector:(selector:string)=>selector==='#seller'?{elements:{namedItem:(name:string)=>values[name]}}:selector==='#imported-image'?preview:notice},chrome:{runtime:{getURL:(path:string)=>'chrome-extension://test/'+path}},t:(v:string)=>v});
 vm.runInContext(guard,context);const start=popup.indexOf('function refreshAffiliateImageGuard()'),end=popup.indexOf("for(const name of ['destination'",start);vm.runInContext(popup.slice(start,end),context);vm.runInContext('refreshAffiliateImageGuard()',context);
 assert.equal(preview.src,preview.dataset.rawImage);assert.equal(preview.hidden,false);assert.equal(notice.hidden,false);assert.equal(notice.textContent,amazonImageNotice);
 const api=(context as any).SellPostlyAffiliate;assert.equal(api.isAmazon('https://amzn.to/x'),true);assert.equal(api.isImage('https://media-amazon.com.evil.test/a.jpg'),false);
 let listener:any,bridged:any;const worker=vm.createContext({URL,URLSearchParams,importScripts:()=>{},SellPostlyAffiliate:api,SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},chrome:{runtime:{id:'test',onMessage:{addListener:(fn:any)=>{listener=fn;}}},tabs:{create:async()=>({id:1})},scripting:{executeScript:async({args}:{args:any[]})=>{bridged=args[0];return [{result:true}];}}}});
 vm.runInContext(await readFile('chrome-extension/unbranded-query.js','utf8'),worker);vm.runInContext(await readFile('chrome-extension/background.js','utf8'),worker);
 const response:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{title:'Imported',destination:'affiliate',category:'Fashion',image:'https://m.media-amazon.com/a.jpg',url:'https://amazon.com/dp/ASIN?tag=ourshop-20'}},{id:'test'},resolve));assert.equal(response.ok,true);assert.equal(bridged.image,'https://m.media-amazon.com/a.jpg');assert.equal(bridged.unbrandedQuery,'travel bag');assert.ok(bridged.url.includes('tag=ourshop-20'));assert.equal(normalizePending(bridged).image,bridged.image);
 const manifest=JSON.parse(await readFile('chrome-extension/manifest.json','utf8'));assert.equal(manifest.version,'1.0.8');
 for(const file of ['headphones','backpack','organizer','bottle','studio-product'])assert.match(await readFile('chrome-extension/demo-products/'+file+'.svg','utf8'),/<svg/);
 for(const key of [amazonImageNotice,'Affiliate Disclosure','Multi-Network Default','Amazon + Multi-Network','Amazon Only','Check Price on Amazon',...disclosurePresets.map(p=>p.text)] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
