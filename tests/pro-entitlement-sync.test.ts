import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {resolveSellerPlan,freeOwner,sellerCredential} from '../src/lib/resolve-seller-plan';
import {postShop} from '../src/lib/shop-mutations';
import {createNicheShop} from '../src/lib/multi-shop-service';
import {sellerPlan} from '../src/lib/seller-plan';
import {setSellerPlan,sellerAccounts} from '../src/lib/seller-plan-admin';
import {shopHeaders} from '../src/app/shop/multi-shop-data';
import type {Query} from '../src/lib/order-service';
function req(token:string,key='',slug='instant-niche'){return new Request('https://example.com/api/shops',{method:'POST',headers:{'x-shop-key':token,'x-pro-key':key,'Content-Type':'application/json'},body:JSON.stringify({action:'createNiche',shop:{name:'Instant Niche',shopMode:'affiliate',nicheName:'Art',customSlug:slug}})});}
test('activating a real master Pro key on a Free account immediately unlocks POST /api/shops and persists entitlement without moving its primary shop',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[],old=process.env.PRO_MASTER_KEYS;
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));process.env.PRO_MASTER_KEYS='SYNTHETIC_SYNC_MASTER';const token='a'.repeat(64),owner=freeOwner(token);await query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'free')",[owner]);const primary=(await query("INSERT INTO shops(owner_key,slug,name,catalog) VALUES($1,'kept-primary','Keep me','{\"products\":[]}'::jsonb) RETURNING id",[owner]))[0];
 const deps={databaseReady:true,resolve:(r:Request)=>resolveSellerPlan(r,{query}),createNiche:(o:string,v:unknown)=>createNicheShop(o,v,query)};
 const before=await postShop(req(token),deps);assert.equal(before.status,403);assert.equal((await before.json()).error,'PRO_PLAN_REQUIRED');
 // This is the same resolution used by /api/pro/verify and every shop mutation.
 const activation=await resolveSellerPlan(req(token,'SYNTHETIC_SYNC_MASTER'),{query});assert.equal(activation?.tier,'pro');assert.equal(activation?.ownerKey,owner);assert.equal((await query('SELECT plan FROM subscriptions WHERE owner_key=$1',[owner]))[0].plan,'pro');
 const immediate=await postShop(req(token,'SYNTHETIC_SYNC_MASTER'),deps);assert.equal(immediate.status,200);const created=await immediate.json();assert.equal(created.shop.storeMode,'niche');assert.equal(created.slug,'instant-niche');assert.equal((await query('SELECT owner_key FROM shops WHERE id=$1::uuid',[created.shop.shopId]))[0].owner_key,owner);
 const later=await postShop(req(token,'','keyless-niche'),deps);assert.equal(later.status,200);const collision=await postShop(req(token,'','instant-niche'),deps);assert.equal(collision.status,409);assert.equal((await collision.json()).error,'SLUG_UNAVAILABLE');assert.equal((await query('SELECT id FROM shops WHERE slug=$1',['kept-primary']))[0].id,primary.id);assert.equal((await sellerAccounts('',query)).filter(a=>a.owner_key===owner)[0].plan,'pro');
 }finally{if(old===undefined)delete process.env.PRO_MASTER_KEYS;else process.env.PRO_MASTER_KEYS=old;await pg.close();}
});
test('database Pro alone and cookie-carried valid licenses both resolve through the same account, with clear missing-auth errors',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));const token='b'.repeat(64),owner=freeOwner(token),source='c'.repeat(64);await query("INSERT INTO subscriptions(owner_key,provider,plan) VALUES($1,'free','pro')",[owner]);assert.equal((await resolveSellerPlan(req(token),{query}))?.tier,'pro');await setSellerPlan({owner_key:owner,plan:'free'},query);assert.equal((await resolveSellerPlan(req(token),{query}))?.tier,'free');
 const cookie=new Request('https://example.com/api/pro/verify',{method:'POST',headers:{cookie:'sellpostly-free-shop-key='+token+'; sellpostly-pro-key=GUMROAD%20SYNTHETIC'}});assert.equal(sellerCredential(cookie,'x-pro-key'),'GUMROAD SYNTHETIC');const identity=await resolveSellerPlan(cookie,{query,verifyKey:async key=>key==='GUMROAD SYNTHETIC'?{ownerKey:source,provider:'gumroad'}:null});assert.equal(identity?.tier,'pro');assert.equal(identity?.ownerKey,owner);assert.equal(await sellerPlan(owner,query),'pro');
 const unauthorized=await postShop(req(''),{databaseReady:true,resolve:r=>resolveSellerPlan(r,{query})});assert.equal(unauthorized.status,401);assert.equal((await unauthorized.json()).error,'AUTH_REQUIRED');
 }finally{await pg.close();}
});
test('sync preserves revocation/expiry and ownership boundaries; an existing license cannot silently capture another account',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));const token='d'.repeat(64),other='e'.repeat(64),owner=freeOwner(token),source='f'.repeat(64);await query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'free'),($2,'free')",[owner,freeOwner(other)]);const deps={query,verifyKey:async()=>({ownerKey:source,provider:'master' as const})};await resolveSellerPlan(req(token,'valid'),deps);await assert.rejects(()=>resolveSellerPlan(req(other,'valid'),deps),/LICENSE_ACCOUNT_CONFLICT/);await query("UPDATE subscriptions SET status='revoked' WHERE owner_key=$1",[source]);assert.equal((await resolveSellerPlan(req(token),{query}))?.tier,'free');assert.equal(await resolveSellerPlan(req('','valid'),deps),null);await query("UPDATE subscriptions SET status='active',expires_at=now()-interval '1 day' WHERE owner_key=$1",[source]);assert.equal(await sellerPlan(owner,query),'free');
 await setSellerPlan({owner_key:owner,plan:'pro'},query);assert.equal(await sellerPlan(owner,query),'pro');await setSellerPlan({owner_key:owner,plan:'free'},query);assert.equal(await sellerPlan(owner,query),'free');
 }finally{await pg.close();}
});
test('activation and shop mutations forward both credentials; niche errors remain specific and localized',async()=>{
 assert.deepEqual(shopHeaders({getItem:k=>k==='sellpostly-pro-key'?' active-key ':' session-token '}),{'x-pro-key':'active-key','x-shop-key':'session-token'});
 const gate=await readFile('src/app/shop/pro-gate.tsx','utf8');assert.ok(gate.includes("headers:{...shopHeaders(localStorage),'x-pro-key':issued}"));assert.ok(gate.includes("headers:{...shopHeaders(localStorage),'x-pro-key':key.trim()}"));const builder=await readFile('src/app/shop/shop-builder.tsx','utf8');assert.ok(builder.includes("credentials:'same-origin',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)}"));
 const source=await readFile('src/app/shop/multi-shop-switcher.tsx','utf8');for(const code of ['AUTH_REQUIRED','PRO_PLAN_REQUIRED','SLUG_UNAVAILABLE','NICHE_LIMIT_REACHED','LICENSE_ACCOUNT_CONFLICT','DATABASE_SCHEMA_REQUIRED'])assert.ok(source.includes(code),code);
});
