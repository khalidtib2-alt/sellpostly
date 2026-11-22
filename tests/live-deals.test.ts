import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {normalizePending,pendingProduct} from '../src/lib/shop-handoff';
import {persistShop,readShopList} from '../src/app/shop/multi-shop-data';
import {translations} from '../src/app/translations';
test('deal text and original prices survive validation, local catalogs, shared snapshots and imports',async()=>{
 const item=pendingProduct(normalizePending({title:'Deal product',price:'85 MAD',compareAtPrice:'145',dealTag:'Flash Deal • 4.6★',url:'https://temu.com/item?affiliate=keep',destination:'affiliate'}));
 const shop=validateShop({shopMode:'affiliate',name:'Deals',products:[item]});const saved=await decodeShop(await encodeShop(shop));assert.equal(saved.products[0].dealTag,'Flash Deal • 4.6★');assert.equal(saved.products[0].compareAtPrice,'145');assert.equal(saved.products[0].url,'https://temu.com/item?affiliate=keep');
 const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v);}};persistShop(shop,storage);assert.equal(readShopList(storage)[0].products[0].dealTag,item.dealTag);
 assert.equal(validateShop({...shop,products:[{...item,dealTag:'x'.repeat(200)}]}).products[0].dealTag?.length,80);assert.equal(validateShop({...shop,products:[{...item,dealTag:undefined}]}).products[0].dealTag,'');
});
test('offer rendering preserves affiliate destinations, reference/original prices and Amazon restrictions',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Price from './src/app/shop/product-price.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const product={id:'p',name:'Deal',price:'85 MAD',compareAtPrice:'145',dealTag:'Flash Deal • 4.6★',url:'https://temu.com/deal?affiliate=keep',category:'Other',gender:'unisex',image:'',source:'Other'};
 const render=(p,mode='affiliate')=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Price,{product:p,mode})));
 const html=render(product);for(const text of ['85 MAD','145 MAD','Check Live Price','Flash Deal','affiliate=keep','nofollow sponsored noopener noreferrer'])assert.ok(html.includes(text),text);assert.ok(html.includes('<del'));
 const amazon=render({...product,url:'https://amazon.com/dp/TEST?tag=keep'});assert.ok(!amazon.includes('85 MAD'));assert.ok(!amazon.includes('145 MAD'));assert.ok(!amazon.includes('Flash Deal'));assert.ok(amazon.includes('tag=keep'));assert.ok(amazon.includes('Check Live Price'));
 const personal=render({...product,url:'https://amazon.com/dp/TEST'},'personal');assert.ok(personal.includes('85 MAD'));assert.ok(personal.includes('Flash Deal'));assert.ok(!personal.includes('Check Live Price'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('editor fields and live-price language labels are available without duplicating the original-price field',async()=>{
 const source=await readFile('src/app/shop/shop-builder.tsx','utf8');assert.equal((source.match(/name="compareAtPrice"/g)||[]).length,1);assert.equal((source.match(/name="dealTag"/g)||[]).length,1);assert.match(source,/dealTag:get\("dealTag"\)/);
 assert.equal(translations['Check Live Price'].fr,'Voir le prix actuel');assert.equal(translations['Check Live Price'].ar,'تحقق من السعر الحالي');
 for(const key of ['Original Price (Optional)','Deal / Rating Badge (Optional)','Prices and offers may change. Confirm the current price at the merchant.'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
