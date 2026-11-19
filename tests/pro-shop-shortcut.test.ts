import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { consumePending,importFromHash,normalizePending,pendingShopKey,prepareShopPhoto,proKey,shopPrice,verifyStoredPro } from '../src/lib/shop-handoff';
import { shopKey,validateShop,type Shop } from '../src/app/shop/shop-data';
function memory(){const values=new Map<string,string>();return {values,getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};}
const blank=():Shop=>({name:'My Shop',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',products:[]});

test('the homepage shortcut requires server verification of the currently saved Pro key',async()=>{
 const storage=memory();let calls=0;
 const request:typeof fetch=async(_input,init)=>{calls++;assert.equal((init?.headers as Record<string,string>)['x-pro-key'],'license');return Response.json({valid:true});};
 assert.equal(await verifyStoredPro(storage,request),false);assert.equal(calls,0);
 storage.setItem(proKey,'license');
 assert.equal(await verifyStoredPro(storage,request),true);
 assert.equal(await verifyStoredPro(storage,async()=>Response.json({valid:false})),false);
 assert.equal(await verifyStoredPro(storage,async()=>Response.json({valid:true},{status:401})),false);
 assert.equal(await verifyStoredPro(storage,async()=>{throw Error('offline');}),false);
 assert.equal(await verifyStoredPro(storage,async()=>{storage.setItem(proKey,'changed');return Response.json({valid:true});}),false);
});

test('local product handoff preserves the original photo, description and URL exactly once',async()=>{
 const storage=memory(),image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYAAAAABJRU5ErkJggg==';
 const description='Padded laptop sleeve\nLightweight everyday design';
 const item=normalizePending({id:'handoff-one',title:'Travel backpack',price:shopPrice('49','USD'),image,description,url:'https://www.amazon.com/dp/item?tag=test'});
 assert.equal(item.source,'Amazon');assert.equal(await prepareShopPhoto(image),image);
 storage.setItem(pendingShopKey,JSON.stringify(item));
 const first=consumePending(blank(),storage);
 assert.equal(first.added,true);assert.equal(storage.getItem(pendingShopKey),null);
 assert.equal(first.shop.products[0].image,image);assert.equal(first.shop.products[0].description,description);
 assert.equal(validateShop(JSON.parse(storage.getItem(shopKey)!)).products[0].description,description);
 storage.setItem(pendingShopKey,JSON.stringify(item));
 const repeated=consumePending(first.shop,storage);
 assert.equal(repeated.added,false);assert.equal(repeated.shop.products.length,1);
 storage.setItem(pendingShopKey,JSON.stringify({...item,id:'newest'}));
 assert.equal(consumePending(repeated.shop,storage).shop.products[0].id,'newest');
 assert.equal(shopPrice('49 USD','USD'),'49 USD');assert.equal(shopPrice('$49','USD'),'$49');
});

test('pending imports remain recoverable when catalog storage is full',()=>{
 const storage=memory(),item=normalizePending({id:'recoverable',title:'Product'});
 storage.setItem(pendingShopKey,JSON.stringify(item));
 const failing={...storage,setItem:(key:string,value:string)=>{if(key===shopKey)throw Error('quota');storage.setItem(key,value);}};
 assert.throws(()=>consumePending(blank(),failing));
 assert.equal(JSON.parse(storage.getItem(pendingShopKey)!).id,'recoverable');
 const result=consumePending(blank(),storage);assert.equal(result.added,true);
});

test('extension service worker opens only the trusted gated shop and preserves long product fields in a fragment',async()=>{
 const source=await readFile('chrome-extension/background.js','utf8');
 let listener:any;const urls:string[]=[];
 const chrome={runtime:{id:'test-extension',onMessage:{addListener:(fn:unknown)=>{listener=fn;}}},tabs:{create:async({url}:{url:string})=>{urls.push(url);return {id:1};}}};
 const context=vm.createContext({chrome,URL,URLSearchParams,crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'}});
 vm.runInContext(source,context);
 const product={title:'Imported product',price:'39 USD',image:'https://images.example.com/product.jpg?key='+'x'.repeat(12000),description:'Full product description',url:'https://www.amazon.com/dp/item?tag='+'y'.repeat(12000)};
 const result:any=await new Promise(resolve=>{assert.equal(listener({type:'SELLPOSTLY_SEND_TO_SHOP',product},{id:'test-extension'},resolve),true);});
 assert.equal(result.ok,true);assert.equal(urls.length,1);
 const url=new URL(urls[0]);assert.equal(url.origin,'https://vercel.app');assert.equal(url.pathname,'/shop');assert.equal(url.search,'');assert.ok(url.hash.length>8000);
 const incoming=importFromHash(url.hash)!;
 assert.equal(incoming.item.title,product.title);assert.equal(incoming.item.url,product.url);assert.equal(incoming.item.image,product.image);assert.equal(incoming.item.description,product.description);assert.equal(incoming.remainingHash,'');
 const denied:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product},{id:'not-this-extension'},resolve));
 assert.equal(denied.ok,false);assert.equal(urls.length,1);
 const failed:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{title:''}},{id:'test-extension'},resolve));
 assert.equal(failed.ok,false);assert.equal(urls.length,1);
});

test('new extension background support does not add permissions',async()=>{
 const manifest=JSON.parse(await readFile('chrome-extension/manifest.json','utf8'));
 assert.equal(manifest.manifest_version,3);
 assert.equal(manifest.background.service_worker,'background.js');
 assert.deepEqual(manifest.permissions,['activeTab','scripting']);
});

