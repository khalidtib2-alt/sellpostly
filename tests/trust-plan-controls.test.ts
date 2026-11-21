import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {storePolicyReady,refundPolicies} from '../src/app/shop/store-policy-data';
import {PUBLISH_SHOP_SQL,publicShop} from '../src/lib/db';
import {submitPeerOrder} from '../src/lib/peer-order-service';
import {sellerPlan} from '../src/lib/seller-plan';
import {sellerAccounts,setSellerPlan} from '../src/lib/seller-plan-admin';
import {createNicheShop,saveNicheShop} from '../src/lib/multi-shop-service';
import {ensureActiveSubscription,cryptoSubscriptionActive} from '../src/lib/subscription-access';
import {translations} from '../src/app/translations';
import type {Query} from '../src/lib/order-service';

test('personal policies require explicit selection and delivery text; legacy records have no invented refund promise',async()=>{
 const old=validateShop({shopMode:'personal',products:[]});assert.equal(old.refundPolicy,undefined);assert.equal(storePolicyReady(old),false);
 for(const refundPolicy of refundPolicies){const valid=validateShop({...old,refundPolicy,deliveryTimeframe:'Digital delivery within 24 hours'});assert.ok(storePolicyReady(valid));const shared=await decodeShop(await encodeShop(valid));assert.equal(shared.refundPolicy,refundPolicy);assert.equal(shared.deliveryTimeframe,valid.deliveryTimeframe);}
 assert.equal(storePolicyReady({...old,refundPolicy:'7_day',deliveryTimeframe:'  '}),false);assert.equal(storePolicyReady(validateShop({shopMode:'affiliate',products:[]})),true);
 await assert.rejects(saveNicheShop('owner',old,async()=>{throw Error('QUERY_MUST_NOT_RUN');}),/STORE_POLICY_REQUIRED/);
});

test('legacy personal checkout is blocked until policies are configured; public policy matches saved catalog',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));await query("INSERT INTO subscriptions(owner_key,provider) VALUES('policy-owner','master')",[]);
 const shop=validateShop({shopMode:'personal',name:'Policy Shop',payments:{COD:{enabled:true}},products:[{id:'p',name:'Item',price:'20 USD',category:'Other'}]});await query(PUBLISH_SHOP_SQL,['policy-owner','policy-shop',shop.name,'',JSON.stringify(shop)]);
 const request={slug:'policy-shop',request_id:'11111111-1111-4111-8111-111111111111',method:'COD',buyer:{name:'Buyer',contact:'buyer@example.com'},items:[{id:'p',quantity:1}]};
 await assert.rejects(submitPeerOrder(request,query),(e:any)=>e.code==='STORE_POLICY_REQUIRED');
 const ready={...shop,refundPolicy:'14_day',deliveryTimeframe:'Ships in 2 business days'};await query(PUBLISH_SHOP_SQL,['policy-owner','unused-slug',shop.name,'',JSON.stringify(ready)]);assert.ok((await submitPeerOrder(request,query)).id);
 const pub=await publicShop('policy-shop',query,'personal');assert.equal(pub?.refundPolicy,'14_day');assert.equal(pub?.deliveryTimeframe,ready.deliveryTimeframe);
 }finally{await pg.close();}
});

test('admin plan overrides are persistent, searchable and enforced without deleting primary shops, niche catalogs or orders',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];const owner='a'.repeat(64),linked='b'.repeat(64),account='c'.repeat(64);
 try{const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await query("INSERT INTO subscriptions(owner_key,provider,email) VALUES($1,'free','seller@example.com'),($2,'crypto','linked@example.com'),($3,'free',NULL)",[owner,linked,account]);
 await query("INSERT INTO shop_account_links(pro_owner,account_owner) VALUES($1,$2)",[linked,account]);
 const primary=validateShop({shopMode:'personal',name:'Main Catalog',refundPolicy:'7_day',deliveryTimeframe:'2 days',payments:{COD:{enabled:true}},products:[]});await query(PUBLISH_SHOP_SQL,[owner,'plan-primary',primary.name,'',JSON.stringify(primary)]);
 assert.equal(await sellerPlan(owner,query),'free');await assert.rejects(createNicheShop(owner,{name:'Niche',shopMode:'affiliate',customSlug:'plan-niche',nicheName:'Art'},query),/PRO_REQUIRED/);
 await setSellerPlan({owner_key:owner,plan:'pro'},query);assert.equal(await sellerPlan(owner,query),'pro');const niche=await createNicheShop(owner,{name:'Niche',shopMode:'affiliate',customSlug:'plan-niche',nicheName:'Art'},query);assert.ok(await publicShop('plan-niche',query,'affiliate'));
 await setSellerPlan({owner_key:owner,plan:'free'},query);assert.equal(await sellerPlan(owner,query),'free');assert.equal(await publicShop('plan-niche',query,'affiliate'),null);assert.ok(await publicShop('plan-primary',query,'personal'));assert.equal((await query('SELECT id FROM shops WHERE id=$1',[niche.shopId])).length,1);
 await assert.rejects(createNicheShop(owner,{name:'New',shopMode:'personal',customSlug:'blocked-niche',nicheName:'Art'},query),/PRO_REQUIRED/);
 const found=await sellerAccounts('Main Catalog',query);assert.equal(found[0].owner_key,owner);assert.equal(found[0].plan,'free');assert.equal(found[0].niche_count,1);
 await setSellerPlan({owner_key:linked,plan:'free'},query);assert.equal(await sellerPlan(linked,query),'free');assert.equal(await sellerPlan(account,query),'free');assert.ok(await cryptoSubscriptionActive(linked,query));
 await ensureActiveSubscription({ownerKey:owner,provider:'master'},query);assert.equal(await sellerPlan(owner,query),'free');
 await pg.exec(schema);assert.equal(await sellerPlan(owner,query),'free');await setSellerPlan({owner_key:owner,plan:'pro'},query);assert.ok(await publicShop('plan-niche',query,'affiliate'));
 await assert.rejects(setSellerPlan({owner_key:owner,plan:'enterprise'},query));
 }finally{await pg.close();}
});

test('seller plan routes reject unauthenticated requests and all new trust labels are translated',async()=>{
 const {GET,POST}=await import('../src/app/api/admin/seller-plans/route');assert.equal((await GET(new Request('https://example.com/api/admin/seller-plans'))).status,401);assert.equal((await POST(new Request('https://example.com/api/admin/seller-plans',{method:'POST',body:JSON.stringify({owner_key:'a'.repeat(64),plan:'pro'})}))).status,401);
 for(const key of ['Refund & Delivery Policy','No Refunds / Final Sale','7-Day Exchange/Return','14-Day Return Policy','Buyer Safety Checklist','Seller Plan Manager','Seller plan saved.'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
 for(const file of ['peer-checkout.tsx','crypto-checkout.tsx','cod-checkout.tsx']){const source=await readFile('src/app/shop/'+file,'utf8');assert.match(source,/<BuyerSafety\s*\/>/);assert.match(source,/<StorePolicy shop=\{shop\}/);}
});
