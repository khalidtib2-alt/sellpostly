import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { requireAdmin } from '../src/lib/admin-auth';
import { overview,updateOrder,updatePayout,updateShop,updateSubscription,subscriptions } from '../src/lib/admin-service';
import { ensureActiveSubscription } from '../src/lib/subscription-access';
import { publicShop } from '../src/lib/db';
import { categories,validateShop } from '../src/app/shop/shop-data';
import type { Query } from '../src/lib/order-service';

test('admin authentication is strict in development and accepts only x-admin-key',()=>{
 const old=process.env.ADMIN_SECRET_KEY;
 try{
  delete process.env.ADMIN_SECRET_KEY;
  assert.throws(()=>requireAdmin(new Request('https://example.com',{headers:{'x-admin-key':'SELLPOSTLY-PRO-DEV'}})));
  process.env.ADMIN_SECRET_KEY='admin-test-secret';
  assert.throws(()=>requireAdmin(new Request('https://example.com',{headers:{'x-pro-key':'admin-test-secret'}})));
  assert.throws(()=>requireAdmin(new Request('https://example.com',{headers:{'x-admin-secret':'admin-test-secret'}})));
  assert.throws(()=>requireAdmin(new Request('https://example.com',{headers:{'x-admin-key':'wrong'}})));
  requireAdmin(new Request('https://example.com',{headers:{'x-admin-key':'admin-test-secret'}}));
 }finally{if(old===undefined)delete process.env.ADMIN_SECRET_KEY;else process.env.ADMIN_SECRET_KEY=old;}
});

test('all admin routes reject unauthorized reads and writes before database access',async()=>{
 const secret=process.env.ADMIN_SECRET_KEY;delete process.env.ADMIN_SECRET_KEY;
 try{
  const routes=await Promise.all([import('../src/app/api/admin/overview/route'),import('../src/app/api/admin/orders/[id]/route'),import('../src/app/api/admin/payouts/[id]/route'),import('../src/app/api/admin/shops/[id]/route'),import('../src/app/api/admin/subscriptions/route')]);
  for(const route of routes){
   const request=new Request('https://example.com',{headers:{'x-admin-key':'anything'}});
   assert.equal((await route.GET(request,{params:Promise.resolve({id:'invalid'})})).status,401);
   if('POST' in route)assert.equal((await route.POST(request,{params:Promise.resolve({id:'invalid'})})).status,401);
  }
 }finally{if(secret!==undefined)process.env.ADMIN_SECRET_KEY=secret;}
});

test('admin ledger transitions, store trust and subscription revocation are enforced in PostgreSQL',async()=>{
 const pg=new PGlite(),owner='a'.repeat(64);
 const query:Query=async(sql,values)=>(await pg.query(sql,values)).rows as Record<string,any>[];
 try{
  const schema=await readFile('src/db/schema.sql','utf8');
  await pg.exec(schema);await pg.exec(schema);
  await pg.query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'master')",[owner]);
  const catalog={name:'Trust Test',bio:'',phone:'',shopMode:'personal',shopTheme:'white',products:[{id:'product',name:'Guide',price:'100 USD',category:'Digital Product',gender:'unisex',image:'',url:'',source:'Other'}],verified:true,suspended:false};
  const {rows:[shop]}=await pg.query<{id:string}>("INSERT INTO shops(owner_key,slug,name,catalog,escrow_hold_days) VALUES($1,'trust-test','Trust Test',$2::jsonb,9) RETURNING id",[owner,JSON.stringify(catalog)]);
  assert.equal((await publicShop('trust-test',query))?.verified,false);
  assert.equal((validateShop(catalog) as any).verified,undefined);
  for(const category of ['Digital Product','Art','Sport'])assert.ok((categories as readonly string[]).includes(category));

  await updateShop(shop.id,{verified:true},query);
  assert.equal((await publicShop('trust-test',query))?.verified,true);
  await updateShop(shop.id,{suspended:true},query);
  assert.equal((await publicShop('trust-test',query))?.suspended,true);
  await assert.rejects(pg.query("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id) VALUES($1,100,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(64)]));
  await assert.rejects(updateShop(shop.id,{verified:'true'},query));
  await updateShop(shop.id,{suspended:false},query);

  const insertPending=async(tx:string)=>(await pg.query<{id:string}>("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id) VALUES($1,100,'USDC','Polygon',$2) RETURNING id",[shop.id,tx])).rows[0].id;
  const orderId=await insertPending('0x'+'1'.repeat(64));
  const held=await updateOrder(orderId,{action:'verify',note:'Checked independently'},query);
  assert.equal(held.status,'held');assert.ok(held.payment_verified_at);assert.ok(held.escrow_release_at);
  assert.equal(new Date(held.escrow_release_at).getTime()-new Date(held.payment_verified_at).getTime(),9*86400000);
  await assert.rejects(updateOrder(orderId,{action:'verify'},query));
  await assert.rejects(updateOrder(orderId,{action:'release'},query));
  await pg.query("UPDATE orders SET status='disputed' WHERE id=$1",[orderId]);
  const refund=await updateOrder(orderId,{action:'refund',note:'Dispute resolved'},query);assert.equal(refund.status,'refunded');
  const audit=await pg.query<{details:any}>('SELECT details FROM orders WHERE id=$1',[orderId]);assert.equal(audit.rows[0].details.admin_actions.length,2);
  await assert.rejects(updateOrder(orderId,{action:'release'},query));

  const invalid=await insertPending('invalid-old-tx');
  await assert.rejects(updateOrder(invalid,{action:'verify'},query));
  assert.equal((await updateOrder(invalid,{action:'cancel'},query)).status,'cancelled');
  await assert.rejects(updateOrder(invalid,{action:'verify'},query));

  const mature=await pg.query<{id:string}>("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,status,payment_verified_at) VALUES($1,200,'USDC','Polygon',$2,'held',now()-interval '10 days') RETURNING id",[shop.id,'0x'+'2'.repeat(64)]);
  assert.equal((await updateOrder(mature.rows[0].id,{action:'release',note:'Hold complete'},query)).status,'released');
  const disputed=await pg.query<{id:string}>("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,status,payment_verified_at) VALUES($1,50,'USDT','Base',$2,'disputed',now()-interval '10 days') RETURNING id",[shop.id,'0x'+'3'.repeat(64)]);
  assert.equal((await updateOrder(disputed.rows[0].id,{action:'release',note:'Resolved after hold'},query)).status,'released');

  const {rows:[payout]}=await pg.query<{id:string}>("SELECT request_seller_payout($1,$2,10,'USDC','Polygon',$3) AS id",[shop.id,owner,'0x'+'1'.repeat(40)]);
  await assert.rejects(updatePayout(payout.id,{action:'paid'},query));
  assert.equal((await updatePayout(payout.id,{action:'approve'},query)).status,'approved');
  assert.equal((await updatePayout(payout.id,{action:'paid',tx_id:'0x'+'4'.repeat(64)},query)).status,'paid');
  await assert.rejects(updatePayout(payout.id,{action:'reject'},query));
  const {rows:[second]}=await pg.query<{id:string}>("SELECT request_seller_payout($1,$2,20,'USDC','Polygon',$3) AS id",[shop.id,owner,'0x'+'1'.repeat(40)]);
  await updatePayout(second.id,{action:'approve'},query);await updatePayout(second.id,{action:'reject'},query);
  const metrics=await overview(query),usdc=metrics.balances.find((b:any)=>b.coin==='USDC');
  assert.equal(usdc.total_gmv,'200.000000');assert.equal(usdc.total_commission_5pct,'10.000000');assert.equal(usdc.paid_payouts,'10.000000');assert.equal(Number(usdc.pending_payouts),0);
  assert.equal(metrics.active_subscriptions,'1');

  await updateSubscription({owner_key:owner,action:'revoke'},query);
  assert.equal(await ensureActiveSubscription({ownerKey:owner,provider:'master'},query),false);
  assert.equal((await subscriptions(query))[0].status,'revoked');
  await assert.rejects(pg.query("SELECT request_seller_payout($1,$2,10,'USDC','Polygon',$3)",[shop.id,owner,'0x'+'1'.repeat(40)]));
  const {fulfill}=await import('../src/lib/order-service');
  await assert.rejects(fulfill(mature.rows[0].id,owner,{tracking:'Reference'},query));
  await updateSubscription({owner_key:owner,action:'activate'},query);
  assert.equal(await ensureActiveSubscription({ownerKey:owner,provider:'master'},query),true);
  const fresh='b'.repeat(64);
  assert.equal(await ensureActiveSubscription({ownerKey:fresh,provider:'master'},query),true);
 }finally{await pg.close();}
});

