import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {requestUpgrade,upgradeStatus,decideUpgrade,upgradeInput,digest} from '../src/lib/pro-upgrade';
import {cryptoSubscriptionActive,ensureActiveSubscription} from '../src/lib/subscription-access';
import {verifyProKey} from '../src/lib/pro-auth';
import {GET as adminGet,POST as adminPost} from '../src/app/api/admin/pro-requests/route';
import type {Query} from '../src/lib/order-service';
test('crypto upgrade is private, exact-priced, atomic, idempotent and revocable',async()=>{
 const pg=new PGlite();const query:Query=async(sql,values)=>(await pg.query(sql,values)).rows as Record<string,any>[];
 const previous={...process.env};process.env.NEXT_PUBLIC_ESCROW_WALLET='0x'+'1'.repeat(40);process.env.NEXT_PUBLIC_ESCROW_NETWORK='Polygon';delete process.env.NEXT_PUBLIC_PRO_PRICE_USD;
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
  const input={email:'Buyer@Example.com',coin:'USDC',tx_id:'0x'+'A'.repeat(64),amount_usd:'0.01'};
  const receipt=await requestUpgrade(input,query);assert.equal(receipt.amount_usd,'15.00');assert.equal(receipt.tx_id,'0x'+'a'.repeat(64));
  const status=()=>upgradeStatus(receipt.tx_id,'buyer@example.com',receipt.receipt_token,query);
  assert.equal((await status()).status,'pending');
  await assert.rejects(upgradeStatus(receipt.tx_id,'other@example.com',receipt.receipt_token,query));
  await assert.rejects(upgradeStatus(receipt.tx_id,'buyer@example.com','0'.repeat(64),query));
  await assert.rejects(upgradeStatus(receipt.tx_id,'buyer@example.com','',query));
  await assert.rejects(requestUpgrade({...input,tx_id:receipt.tx_id},query));
  const results=await Promise.all([decideUpgrade({id:receipt.id,action:'approve'},query),decideUpgrade({id:receipt.id,action:'approve'},query)]);
  assert.equal(results[0].issued_license_key,results[1].issued_license_key);
  assert.match(results[0].issued_license_key,/^SP-PRO-[A-F0-9]{64}$/);
  const rows=await query('SELECT * FROM subscriptions',[]);assert.equal(rows.length,1);
  const sub=rows[0],owner=digest('sellpostly-license:'+results[0].issued_license_key);
  assert.equal(sub.owner_key,owner);assert.equal(sub.provider,'crypto');assert.equal((await status()).issued_license_key,results[0].issued_license_key);
  assert.ok(new Date(sub.expires_at).getTime()>Date.now()+29*86400000);
  assert.equal(await cryptoSubscriptionActive(owner,query),true);
  await query("UPDATE subscriptions SET status='revoked' WHERE owner_key=$1",[owner]);
  assert.equal(await ensureActiveSubscription({ownerKey:owner,provider:'crypto'},query),false);
  await decideUpgrade({id:receipt.id,action:'approve'},query);assert.equal(await cryptoSubscriptionActive(owner,query),false);
  await query("UPDATE subscriptions SET status='active',expires_at=now()-interval '1 second' WHERE owner_key=$1",[owner]);
  assert.equal(await cryptoSubscriptionActive(owner,query),false);
  assert.equal(await ensureActiveSubscription({ownerKey:'f'.repeat(64),provider:'crypto'},query),false);
  await assert.rejects(decideUpgrade({id:receipt.id,action:'reject'},query));
  process.env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD='199.99';
  const second=await requestUpgrade({...input,coin:'USDT',plan:'lifetime',tx_id:'0x'+'b'.repeat(64)},query);
  const lifetime=await decideUpgrade({id:second.id,action:'approve'},query);
  assert.notEqual(lifetime.issued_license_key,results[0].issued_license_key);
  const life=(await query("SELECT expires_at FROM subscriptions WHERE owner_key=$1",[digest('sellpostly-license:'+lifetime.issued_license_key)]))[0];
  assert.equal(life.expires_at,null);
  const third=await requestUpgrade({...input,tx_id:'0x'+'c'.repeat(64)},query);
  await decideUpgrade({id:third.id,action:'reject'},query);await assert.rejects(decideUpgrade({id:third.id,action:'approve'},query));
  assert.equal((await query('SELECT count(*)::int AS count FROM subscriptions',[]))[0].count,2);
  delete process.env.NEXT_PUBLIC_B2B_PLAN_PRICE;
  const b2b=await requestUpgrade({...input,plan:'b2b',language:'es',amount_usd:'0.01',tx_id:'0x'+'d'.repeat(64)},query);
  assert.equal(b2b.amount_usd,'49.00');
  const agency=await decideUpgrade({id:b2b.id,action:'approve'},query);
  const agencySub=(await query('SELECT expires_at FROM subscriptions WHERE owner_key=$1',[digest('sellpostly-license:'+agency.issued_license_key)]))[0];
  assert.ok(new Date(agencySub.expires_at).getTime()>Date.now()+29*86400000);
  assert.ok(new Date(agencySub.expires_at).getTime()<Date.now()+31*86400000);
  process.env.NEXT_PUBLIC_B2B_PLAN_PRICE='59.95';
  assert.equal(upgradeInput({...input,plan:'b2b'}).amount,'59.95');
 }finally{for(const key of ['NEXT_PUBLIC_ESCROW_WALLET','NEXT_PUBLIC_ESCROW_NETWORK','NEXT_PUBLIC_PRO_PRICE_USD','NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD','NEXT_PUBLIC_B2B_PLAN_PRICE']){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}await pg.close();}
});
test('upgrade validation and admin authorization fail closed; existing master keys still work',async()=>{
 const prior={...process.env};
 try{
  delete process.env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD;
  const valid={email:'buyer@example.com',coin:'USDT',tx_id:'0x'+'1'.repeat(64)};
  for(const change of [{email:'bad'},{coin:'ETH'},{network:'Base'},{tx_id:'invalid'},{plan:'weekly'},{plan:'lifetime'}])assert.throws(()=>upgradeInput({...valid,...change}));
  process.env.ADMIN_SECRET_KEY='admin-test';delete process.env.DATABASE_URL;
  assert.equal((await adminGet(new Request('https://example.com/api/admin/pro-requests'))).status,401);
  assert.equal((await adminPost(new Request('https://example.com/api/admin/pro-requests',{method:'POST',headers:{'x-admin-key':'wrong'},body:'{}'}))).status,401);
  assert.equal(await verifyProKey('SP-PRO-'+'A'.repeat(64)),null);
  process.env.PRO_MASTER_KEYS='legacy-master';
  assert.equal((await verifyProKey('legacy-master'))?.provider,'master');
 }finally{for(const key of ['NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD','ADMIN_SECRET_KEY','DATABASE_URL','PRO_MASTER_KEYS']){if(prior[key]===undefined)delete process.env[key];else process.env[key]=prior[key];}}
});

