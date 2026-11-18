import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { verifyProKey } from '../src/lib/pro-auth';
import { validateShop } from '../src/app/shop/shop-data';

test('Pro verification rejects dev key in production, validates master keys and Gumroad revocations',async()=>{
  const old={...process.env};const originalFetch=globalThis.fetch;
  try{
    delete process.env.PRO_MASTER_KEYS;delete process.env.GUMROAD_PRODUCT_ID;
    (process.env as Record<string,string|undefined>).NODE_ENV='production';
    assert.equal(await verifyProKey('SELLPOSTLY-PRO-DEV'),null);
    (process.env as Record<string,string|undefined>).NODE_ENV='development';
    assert.equal((await verifyProKey('SELLPOSTLY-PRO-DEV'))?.provider,'development');
    process.env.PRO_MASTER_KEYS='master-one, master-two';
    assert.equal(await verifyProKey('SELLPOSTLY-PRO-DEV'),null);
    assert.equal((await verifyProKey('master-two'))?.provider,'master');
    assert.equal(await verifyProKey('master-tw'),null);
    process.env.GUMROAD_PRODUCT_ID='product';
    const purchase={product_id:'product',refunded:false};
    globalThis.fetch=async(_url,options)=>{
      assert.equal(new URLSearchParams(String(options?.body)).get('increment_uses_count'),'false');
      return Response.json({success:true,purchase});
    };
    assert.equal((await verifyProKey('gumroad-key'))?.provider,'gumroad');
    purchase.refunded=true;assert.equal(await verifyProKey('gumroad-key'),null);
    globalThis.fetch=async()=>{throw Error('offline');};
    assert.equal(await verifyProKey('gumroad-key'),null);
  }finally{globalThis.fetch=originalFetch;for(const k of ['NODE_ENV','PRO_MASTER_KEYS','GUMROAD_PRODUCT_ID']){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
});

test('legacy shops default safely and preserve logo/hold settings',()=>{
  const legacy={name:'Store',products:[]};
  assert.equal(validateShop(legacy).escrowHoldDays,7);
  assert.equal(validateShop({...legacy,escrowHoldDays:16}).escrowHoldDays,7);
  assert.equal(validateShop({...legacy,logo:'javascript:alert(1)',escrowHoldDays:3}).logo,'');
  const shop=validateShop({...legacy,logo:'https://example.com/logo.png',escrowHoldDays:15});
  assert.equal(shop.escrowHoldDays,15);assert.equal(shop.logo,'https://example.com/logo.png');
});

test('schema initializes twice, computes 5% commission, enforces holds and reserves payouts',async()=>{
  const pg=new PGlite();
  try{
    const schema=await readFile('src/db/schema.sql','utf8');
    await pg.exec(schema);await pg.exec(schema);
    await pg.query("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master')");
    const {rows:[shop]}=await pg.query<{id:string}>("INSERT INTO shops(owner_key,slug,name,escrow_hold_days) VALUES('owner','test-store','Test',7) RETURNING id");
    await assert.rejects(pg.query("UPDATE shops SET escrow_hold_days=2 WHERE id=$1",[shop.id]));
    const {rows:[order]}=await pg.query<{id:string;commission_amount:string;net_amount:string;escrow_hold_days:number}>("INSERT INTO orders(shop_id,gross_amount,coin,network,escrow_hold_days) VALUES($1,100,'USDC','Polygon',3) RETURNING *",[shop.id]);
    assert.equal(Number(order.commission_amount),5);assert.equal(Number(order.net_amount),95);assert.equal(order.escrow_hold_days,7);
    await assert.rejects(pg.query("UPDATE orders SET status='released' WHERE id=$1",[order.id]));
    await pg.query("UPDATE orders SET status='held',tx_id='tx1',payment_verified_at=now() WHERE id=$1",[order.id]);
    await assert.rejects(pg.query("UPDATE orders SET status='released' WHERE id=$1",[order.id]));
    await assert.rejects(pg.query("UPDATE orders SET gross_amount=200 WHERE id=$1",[order.id]));
    // A separately verified historical order is now eligible for payout.
    await pg.query("INSERT INTO orders(shop_id,gross_amount,coin,network,status,tx_id,payment_verified_at) VALUES($1,100,'USDC','Polygon','released','tx2',now()-interval '8 days')",[shop.id]);
    await assert.rejects(pg.query("SELECT request_seller_payout($1,'owner',9,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(40)]));
    await assert.rejects(pg.query("SELECT request_seller_payout($1,'intruder',10,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(40)]));
    await pg.query("SELECT request_seller_payout($1,'owner',60,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(40)]);
    await assert.rejects(pg.query("SELECT request_seller_payout($1,'owner',40,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(40)]));
    await pg.query("SELECT request_seller_payout($1,'owner',35,'USDC','Polygon',$2)",[shop.id,'0x'+'1'.repeat(40)]);
  }finally{await pg.close();}
});

test('production initialization and publishing reject unauthorized requests before database access',async()=>{
  const {POST:init}=await import('../src/app/api/db/init/route');
  const {POST:publish}=await import('../src/app/api/shops/route');
  const env=process.env as Record<string,string|undefined>;
  const old={...env};
  try{
    env.NODE_ENV='production';delete env.ADMIN_SECRET_KEY;delete env.PRO_MASTER_KEYS;delete env.GUMROAD_PRODUCT_ID;
    assert.equal((await init(new Request('https://example.com/api/db/init',{method:'POST'}))).status,401);
    env.ADMIN_SECRET_KEY='secret';
    assert.equal((await init(new Request('https://example.com/api/db/init',{method:'POST',headers:{'x-admin-secret':'wrong'}}))).status,401);
    assert.equal((await publish(new Request('https://example.com/api/shops',{method:'POST'}))).status,401);
    env.PRO_MASTER_KEYS='valid';delete env.DATABASE_URL;
    assert.equal((await publish(new Request('https://example.com/api/shops',{method:'POST',headers:{'x-pro-key':'valid'}}))).status,503);
  }finally{for(const key of ['NODE_ENV','ADMIN_SECRET_KEY','PRO_MASTER_KEYS','GUMROAD_PRODUCT_ID','DATABASE_URL']){if(old[key]===undefined)delete env[key];else env[key]=old[key];}}
});
