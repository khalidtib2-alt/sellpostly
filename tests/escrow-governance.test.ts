import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PUBLISH_SHOP_SQL,publicShop,sellerShopSettings } from '../src/lib/db';
import { updateShop,updateOrder } from '../src/lib/admin-service';
import { buyerAction,dashboard,type Query } from '../src/lib/order-service';

test('admin-only hold assignment survives forged publishing and preserves order snapshots',async()=>{
 const pg=new PGlite(),owner='c'.repeat(64);
 const query:Query=async(sql,values)=>(await pg.query(sql,values)).rows as Record<string,any>[];
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
  await pg.query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'master')",[owner]);
  const catalog={name:'Governance',bio:'',phone:'',shopMode:'personal',shopTheme:'white',escrowHoldDays:15,products:[]};
  await query(PUBLISH_SHOP_SQL,[owner,'governance-shop','Governance','',JSON.stringify(catalog)]);
  const shop=(await pg.query<{id:string;escrow_hold_days:number}>('SELECT id,escrow_hold_days FROM shops WHERE owner_key=$1',[owner])).rows[0];
  assert.equal(shop.escrow_hold_days,7);assert.equal((await publicShop('governance-shop',query))?.escrowHoldDays,7);
  await updateShop(shop.id,{escrow_hold_days:12},query);
  assert.equal((await sellerShopSettings(owner,query)).escrow_hold_days,12);
  await query(PUBLISH_SHOP_SQL,[owner,'ignored-new-slug','Edited','',JSON.stringify({...catalog,escrowHoldDays:3})]);
  assert.equal((await publicShop('governance-shop',query))?.escrowHoldDays,12);
  for(const value of [2,16,7.5,null,'7'])await assert.rejects(updateShop(shop.id,{escrow_hold_days:value},query));
  const {rows:[order]}=await pg.query<{id:string;escrow_hold_days:number}>("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details) VALUES($1,100,'USDC','Polygon',$2,$3::jsonb) RETURNING id,escrow_hold_days",[shop.id,'0x'+'5'.repeat(64),JSON.stringify({buyer:{name:'Buyer',contact:'buyer@example.com'}})]);
  assert.equal(order.escrow_hold_days,12);
  await updateShop(shop.id,{escrow_hold_days:3},query);
  const held=await updateOrder(order.id,{action:'verify'},query);
  const originalDeadline=new Date(held.escrow_release_at).getTime();
  assert.equal(originalDeadline-new Date(held.payment_verified_at).getTime(),12*86400000);
  await assert.rejects(updateOrder(order.id,{action:'release'},query));
  await assert.rejects(updateOrder(order.id,{action:'release',forceRelease:'true'},query));
  await assert.rejects(updateOrder(order.id,{action:'release',forceRelease:true},query),(error:any)=>error.code==='BUYER_CONFIRMATION_REQUIRED');
  await assert.rejects(pg.query("UPDATE orders SET status='released',force_released_at=now(),details=details||jsonb_build_object('buyer_confirmed_at',now()) WHERE id=$1",[order.id]));
  const confirmation=await buyerAction(order.id,{contact:'buyer@example.com',action:'confirm_receipt',forceRelease:true},query);
  assert.equal(confirmation.status,'held');
  await assert.rejects(updateOrder(order.id,{action:'release'},query));
  const released=await updateOrder(order.id,{action:'release',forceRelease:true,note:'Buyer confirmed receipt'},query);
  assert.equal(released.status,'released');assert.ok(released.force_released_at);
  assert.equal(new Date(released.escrow_release_at).getTime(),originalDeadline);
  const record=(await pg.query<{details:any;escrow_hold_days:number}>('SELECT details,escrow_hold_days FROM orders WHERE id=$1',[order.id])).rows[0];
  assert.equal(record.escrow_hold_days,12);assert.equal(record.details.admin_actions.at(-1).force_release,true);
  await assert.rejects(pg.query('UPDATE orders SET force_released_at=NULL WHERE id=$1',[order.id]));
  const balances=(await dashboard(owner,query)).balances;
  assert.equal(balances[0].available_balance,'95.000000');
  await pg.query("SELECT request_seller_payout($1,$2,50,'USDC','Polygon',$3)",[shop.id,owner,'0x'+'1'.repeat(40)]);
  assert.equal((await dashboard(owner,query)).balances[0].available_balance,'45.000000');
  await assert.rejects(updateOrder(order.id,{action:'refund'},query));

  const {rows:[disputed]}=await pg.query<{id:string;escrow_hold_days:number}>("INSERT INTO orders(shop_id,gross_amount,coin,network,tx_id,details) VALUES($1,20,'USDC','Polygon',$2,$3::jsonb) RETURNING id,escrow_hold_days",[shop.id,'0x'+'6'.repeat(64),JSON.stringify({buyer:{name:'Buyer',contact:'buyer@example.com'}})]);
  assert.equal(disputed.escrow_hold_days,3);
  await updateOrder(disputed.id,{action:'verify'},query);
  await buyerAction(disputed.id,{contact:'buyer@example.com',action:'dispute',reason:'Follow-up'},query);
  await assert.rejects(updateOrder(disputed.id,{action:'release',forceRelease:true},query));
  assert.equal((await buyerAction(disputed.id,{contact:'buyer@example.com',action:'confirm_receipt'},query)).status,'disputed');
  assert.equal((await updateOrder(disputed.id,{action:'release',forceRelease:true},query)).status,'released');
 }finally{await pg.close();}
});

test('force-release requests still require the strict admin header',async()=>{
 const old=process.env.ADMIN_SECRET_KEY;process.env.ADMIN_SECRET_KEY='admin-governance-test';
 try{
  const {POST}=await import('../src/app/api/admin/orders/[id]/route');
  const response=await POST(new Request('https://example.com/api/admin/orders/id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'release',forceRelease:true})}),{params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})});
  assert.equal(response.status,401);
 }finally{if(old===undefined)delete process.env.ADMIN_SECRET_KEY;else process.env.ADMIN_SECRET_KEY=old;}
});

