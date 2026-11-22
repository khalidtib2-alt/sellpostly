import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateCopy} from '../src/lib/gemini-generation';
import {copyInput,localCopy} from '../src/lib/generation-data';
import {resizeCorner} from '../src/app/tools/crop-corners';
import {validateShop} from '../src/app/shop/shop-data';
import {studioProduct,publishStudioProduct} from '../src/lib/studio-handoff';
import {persistShop,shopDraftKey} from '../src/app/shop/multi-shop-data';
import {renameShop} from '../src/lib/shop-slug';
import {translations} from '../src/app/translations';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
test('copy diagnostics keep fallback useful and never echo provider secrets',async()=>{
 const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='AQ.SECRET_TEST';try{for(const [status,message,code] of [[429,'quota AQ.SECRET_TEST','QUOTA'],[403,'billing required AQ.SECRET_TEST','BILLING'],[401,'invalid key AQ.SECRET_TEST','AUTH']] as const){let calls=0;const copy=await generateCopy(copyInput({title:'Product'}),async()=>{calls++;return Response.json({error:{message}},{status});});assert.equal(copy.source,'local');assert.equal(copy.diagnostic?.code,code);assert.equal(calls,1);assert.doesNotMatch(JSON.stringify(copy),/SECRET_TEST/);}}finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});

test('all four crop corners keep the opposite anchor, image bounds and preset aspect ratio',()=>{
 const crop={x:.2,y:.2,w:.5,h:.5};for(const corner of ['nw','ne','sw','se'] as const){const out=resizeCorner(crop,corner,.1,.1);assert.ok(out.x>=0&&out.y>=0&&out.x+out.w<=1&&out.y+out.h<=1);assert.equal(Number((corner.includes('w')?out.x+out.w:out.x).toFixed(4)),corner.includes('w')?.7:.2);assert.equal(Number((corner.includes('n')?out.y+out.h:out.y).toFixed(4)),corner.includes('n')?.7:.2);const fixed=resizeCorner(crop,corner,-3,3,4/3);assert.ok(Math.abs(fixed.w/fixed.h-4/3)<.00001);}
});
test('studio publishing targets the selected niche, upserts once and preserves existing product/payment data and Amazon rules',async()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}} as Storage;
 const shop=validateShop({shopId:'11111111-1111-4111-8111-111111111111',customSlug:'my-niche',storeMode:'niche',nicheName:'Audio',shopMode:'personal',name:'Audio shop',cryptoWallet:'0x'+'1'.repeat(40),refundPolicy:'7_day',deliveryTimeframe:'2 days',products:[{id:'existing',name:'Original',price:'10 USD',category:'Audio',image:'https://m.media-amazon.com/a.jpg',url:'https://amazon.com/dp/B012345678',isDigital:true,digitalDownloadUrl:'https://example.com/private'}]});persistShop(shop,storage);
 const item=studioProduct({id:'existing',title:'Updated',price:'12 USD',description:'Updated details',image:'https://m.media-amazon.com/a.jpg',url:'https://amazon.com/dp/B012345678',keyHighlights:['One','Two','Three'],promoCaption:'Caption'},shop);let published:any;const request=async(_url:any,options:any)=>{published=JSON.parse(options.body);return Response.json({slug:'my-niche'});};await publishStudioProduct(item,shop,storage,request);await publishStudioProduct(item,shop,storage,request);const saved=JSON.parse(storage.getItem(shopDraftKey(shop))!);assert.equal(saved.products.length,1);assert.equal(saved.products[0].name,'Updated');assert.equal(saved.products[0].category,'Audio');assert.equal(saved.products[0].isDigital,true);assert.equal(saved.products[0].digitalDownloadUrl,'https://example.com/private');assert.equal(saved.products[0].promoCaption,'Caption');assert.deepEqual(saved.products[0].keyHighlights,['One','Two','Three']);assert.match(saved.products[0].image,/media-amazon/);assert.equal(published.cryptoWallet,shop.cryptoWallet);assert.equal(published.refundPolicy,shop.refundPolicy);assert.equal(storage.getItem('sellpostly_pending_shop_item'),null);const affiliate=validateShop({...saved,shopMode:'affiliate',products:saved.products.map((p:any)=>({...p,catalogMode:'affiliate'}))});assert.match(affiliate.products[0].image,/media-amazon/);
});
test('slug changes enforce owner identity and validate URL paths without interpolating SQL',async()=>{
 let args:any;await renameShop('owner',{currentSlug:'old-slug',slug:'new-slug'},async(sql,values)=>{assert.ok(sql.includes('owner_key=$1'));args=values;return [{slug:'new-slug'}];});assert.deepEqual(args,['owner','old-slug','new-slug']);await assert.rejects(()=>renameShop('owner',{currentSlug:'old',slug:'../admin'}));await assert.rejects(()=>renameShop('other',{currentSlug:'old-slug',slug:'new-slug'},async()=>[]));
});
test('workspace routes and localized UI keep settings out of products, tools redirect and extension short bridge',async()=>{
 const builder=await readFile('src/app/shop/shop-builder.tsx','utf8');assert.ok(builder.includes("workspace==='settings'&&!shared&&loaded"));assert.ok(builder.includes("workspace==='products'&&adding"));assert.match(await readFile('src/app/tools/page.tsx','utf8'),/redirect\('\/studio'\)/);const background=await readFile('chrome-extension/background.js','utf8');assert.ok(background.includes('SELLPOSTLY_OPEN_STUDIO'));assert.ok(background.includes('sellpostly_pending_studio_item'));assert.ok(!background.includes('importProduct='));for(const path of ['src/app/studio/studio-workspace.tsx','src/app/generation/copy-assistant.tsx','src/app/generation/gemini-writer-panel.tsx']){const source=await readFile(path,'utf8');for(const match of source.matchAll(/\bt\('([^']+)'\)/g)){const key=match[1] as keyof typeof translations;assert.ok(translations[key]?.fr,key);assert.match(translations[key]?.ar||'',/[\u0600-\u06ff]/,key);}}
});
