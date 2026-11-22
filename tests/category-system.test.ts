import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {categoryOptions,addCustomCategory,activeCategory,catalogExport,categoryKey} from '../src/app/shop/category-data';
import {persistShop,readShopList} from '../src/app/shop/multi-shop-data';
import {switchCatalog} from '../src/app/shop/catalog-modes';
import {translations} from '../src/app/translations';
const product=(id:string,category:string)=>({id,name:id,category,price:'19 MAD',url:'https://example.com/deal?tag=keep'});
const shop=()=>validateShop({name:'Category Test',shopMode:'affiliate',customCategories:['Kitchen Finds','Empty Collection'],products:[product('one','Fashion'),product('two','Kitchen Finds')]});
test('public categories hide empty entries, owner categories retain them, and empty selections recover after deletion or reassignment',()=>{
 const value=shop();assert.deepEqual(categoryOptions(value).map(c=>[c.name,c.count]),[['All',2],['Fashion',1],['Kitchen Finds',1]]);assert.ok(categoryOptions(value,true).some(c=>c.name==='Empty Collection'&&c.count===0));assert.ok(categoryOptions(value,true).some(c=>c.name==='Beauty'&&c.count===0));
 const deleted=validateShop({...value,products:value.products.filter(p=>p.category!=='Fashion')});assert.equal(activeCategory(deleted,'Fashion',true),'All');assert.ok(!categoryOptions(deleted).some(c=>c.name==='Fashion'));
 const moved=validateShop({...value,products:value.products.map(p=>({...p,category:'Other'}))});assert.equal(activeCategory(moved,'Kitchen Finds',true),'All');assert.equal(activeCategory(value,'Empty Collection',false),'Empty Collection');assert.deepEqual(categoryOptions({...value,products:[]}),[{name:'All',count:0}]);
});
test('custom category names normalize spaces, Unicode and case, reject duplicates, and persist before products are assigned',async()=>{
 let value=addCustomCategory(shop(),'  Local   Favourites  ');assert.equal(value.customCategories?.at(-1),'Local Favourites');assert.throws(()=>addCustomCategory(value,'LOCAL favourites'),/CATEGORY_EXISTS/);assert.throws(()=>addCustomCategory(value,'Ｆａｓｈｉｏｎ'),/CATEGORY_EXISTS/);assert.throws(()=>addCustomCategory(value,'  '),/CATEGORY_REQUIRED/);assert.equal(categoryKey(' Home   & Kitchen '),'home & kitchen');
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)||null,setItem:(k:string,v:string)=>{map.set(k,v);}};persistShop(value,storage);assert.ok(readShopList(storage)[0].customCategories?.includes('Local Favourites'));assert.ok((await decodeShop(await encodeShop(value))).customCategories?.includes('Local Favourites'));
 value=validateShop({...value,products:[...value.products,product('three','New Typed Category')]});assert.ok(value.customCategories?.includes('New Typed Category'));
 const personal=switchCatalog(value,'personal',storage);assert.ok(!personal.customCategories?.includes('Local Favourites'));assert.ok(switchCatalog(personal,'affiliate',storage).customCategories?.includes('Local Favourites'));
});
test('catalog exports products and category defaults without private payment or digital-delivery settings',()=>{
 const value=validateShop({...shop(),cryptoWallet:'private-wallet',sellerEmail:'seller@example.com',products:[{...product('digital','Digital Product'),digitalDeliveryNote:'private-note',digitalDownloadUrl:'https://example.com/private-key'}]});const out=catalogExport(value);assert.ok(out.categories.includes('Fashion'));assert.ok(out.customCategories.includes('Empty Collection'));assert.equal(out.products[0].url,'https://example.com/deal?tag=keep');assert.doesNotMatch(JSON.stringify(out),/private-wallet|seller@example|private-note|private-key/);assert.equal(JSON.parse(JSON.stringify(out)).version,1);
});
test('public storefront rendering omits empty category pills and owner rendering includes management and JSON export',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Builder from './src/app/shop/shop-builder.tsx';import {LanguageProvider} from './src/app/language-context.tsx';import {validateShop} from './src/app/shop/shop-data.ts';
 const shop=validateShop({name:'Test',shopMode:'affiliate',customCategories:['Empty Custom'],products:[{id:'p',name:'One',category:'Fashion',url:'https://example.com'}]});const render=shared=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Builder,{initialShop:shop,isSharedBuyerView:shared})));
 const publicHtml=render(true);assert.ok(publicHtml.includes('Fashion<!-- --> (1)')||publicHtml.includes('Fashion (1)')||publicHtml.includes('Fashion'));assert.ok(!publicHtml.includes('Empty Custom'));assert.ok(!publicHtml.includes('Manage Categories'));assert.ok(!publicHtml.includes('Export Catalog JSON'));
 const owner=render(false);assert.ok(owner.includes('Empty Custom'));assert.ok(owner.includes('Manage Categories'));assert.ok(owner.includes('Copy Catalog JSON'));assert.ok(owner.includes('Download Catalog JSON'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('category manager and editor copy support French and Arabic',async()=>{
 for(const file of ['src/app/shop/category-manager.tsx']){const source=await readFile(file,'utf8');for(const match of source.matchAll(/\bt\('([^']+)'\)/g)){const key=match[1] as keyof typeof translations;assert.ok(translations[key]?.fr,key);assert.match(translations[key]?.ar||'',/[\u0600-\u06ff]/,key);}}
});
