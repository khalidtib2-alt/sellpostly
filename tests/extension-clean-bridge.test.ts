import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {test} from 'node:test';
test('direct extension bridge keeps long products out of the address bar',async()=>{let listener:any,opened:string|undefined,stored:any;
const ctx=vm.createContext({URL,URLSearchParams,crypto:{randomUUID:()=> 'short-id'},setTimeout,chrome:{runtime:{id:'test',onMessage:{addListener:(f:any)=>listener=f}},tabs:{create:async({url}:{url:string})=>{opened=url;return{id:1};}},scripting:{executeScript:async({args}:{args:any[]})=>{stored=args[0];return[{result:true}];}}},SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},importScripts:()=>{}});
for(const file of ['affiliate-guard.js','unbranded-query.js','background.js'])vm.runInContext(fs.readFileSync('chrome-extension/'+file,'utf8'),ctx);
const result:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_SEND_TO_SHOP',product:{title:'Example',description:'x'.repeat(10000),image:'https://image.example/x?long='+'a'.repeat(10000),url:'https://www.amazon.com/item-name/dp/B012345678/ref=abc?tag=tracking&utm_source=foo'}},{id:'test'},resolve));
assert.equal(result.ok,true);assert.equal(opened,'https://sellpostly.vercel.app/shop');assert.equal(stored.description.length,240);assert.equal(stored.url,'https://www.amazon.com/dp/B012345678');assert.ok(stored.image.length>9000);console.log('PASS: short /shop URL, direct payload bridge, Amazon canonicalization, 240-character description.');
});


