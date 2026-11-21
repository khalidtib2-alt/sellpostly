import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { units,decimal,priceItems,contact,txId } from '../src/lib/order-validation';
import type { Product } from '../src/app/shop/shop-data';

const product:Product={id:'product-1',name:'Headphones',price:'99.999999 USD',category:'Tech & Gadgets',gender:'unisex',url:'',image:'',source:'Other'};
test('decimal prices and buyer identifiers are normalized without floating point',()=>{
 assert.equal(decimal(units('99.999999')*BigInt(2)),'199.999998');
 assert.equal(priceItems([product],[{id:product.id,quantity:2}], 'USDC').gross,'199.999998');
 assert.throws(()=>priceItems([product],[{id:product.id,quantity:1.5}],'USDC'));
 assert.throws(()=>priceItems([product],[{id:product.id,quantity:99},{id:product.id,quantity:1}],'USDC'));
 assert.throws(()=>priceItems([{...product,price:'20 EUR'}],[{id:product.id,quantity:1}],'USDC'));
 assert.throws(()=>priceItems([{...product,price:'20 USDT'}],[{id:product.id,quantity:1}],'USDC'));
 assert.equal(contact('Buyer@Example.COM'),'buyer@example.com');
 assert.equal(contact('+212 612-345-678'),'212612345678');
 assert.throws(()=>contact('anything'));
 assert.equal(txId('0x'+'A'.repeat(64),'Polygon'),'0x'+'a'.repeat(64));
 assert.throws(()=>txId('fake-tx','Polygon'));
});

test('buyer and seller workflows enforce contact, ownership, holds and precise isolated balances',async()=>{
 const env=process.env as Record<string,string|undefined>;
 const before={wallet:env.NEXT_PUBLIC_ESCROW_WALLET,network:env.NEXT_PUBLIC_ESCROW_NETWORK};
 env.NEXT_PUBLIC_ESCROW_WALLET='0x'+'1'.repeat(40);env.NEXT_PUBLIC_ESCROW_NETWORK='Polygon';
 const service=await import('../src/lib/order-service');
 const pg=new PGlite();
 const query:import('../src/lib/order-service').Query=async(sql,values)=>(await pg.query(sql,values)).rows as Record<string,any>[];
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
  await pg.query("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('stranger','master')");
  const catalog={name:'Test Shop',bio:'',phone:'',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',shopTheme:'white',products:[product]};
  const {rows:[shop]}=await pg.query<{id:string}>("INSERT INTO shops(owner_key,slug,name,catalog,escrow_hold_days) VALUES('owner','test-shop','Test',$1::jsonb,9) RETURNING id",[JSON.stringify(catalog)]);
  const request={slug:'test-shop',coin:'USDC',network:'Polygon',tx_id:'0x'+'a'.repeat(64),items:[{id:product.id,quantity:2}],buyer:{name:'Buyer',contact:'Buyer@Example.com'},gross_amount:'0.01',status:'released'};
  const order=await service.submitOrder(request,query);
  assert.equal(order.status,'pending');assert.equal(order.gross_amount,'199.999998');assert.equal(order.escrow_hold_days,9);
  await assert.rejects(service.submitOrder({...request,tx_id:'0x'+'A'.repeat(64)},query));
  const pendingDashboard=await service.dashboard('owner',query);
  assert.equal(Number(pendingDashboard.balances[0].gross_sales),0);
  assert.equal((await service.dashboard('stranger',query)).orders.length,0);
  await assert.rejects(service.fulfill(order.id,'stranger',{tracking:'tracking'},query));
  await assert.rejects(service.fulfill(order.id,'owner',{tracking:'tracking'},query));
  await pg.query("UPDATE orders SET status='held',payment_verified_at=now() WHERE id=$1",[order.id]);
  await assert.rejects(service.buyerAction(order.id,{contact:'wrong@example.com',action:'dispute',reason:'Missing'},query));
  const confirmation=await service.buyerAction(order.id,{contact:'buyer@example.com',action:'confirm_receipt'},query);
  assert.equal(confirmation.status,'held');assert.ok(confirmation.buyer_confirmed_at);
  await service.fulfill(order.id,'owner',{tracking:'TRACK-1',delivery_notes:'digital-key-123'},query);
  const buyerView=await service.buyerAction(order.id,{contact:'buyer@example.com',action:'status'},query);
  assert.equal(buyerView.fulfillment.delivery_notes,'digital-key-123');assert.equal(buyerView.details,undefined);
  const disputed=await service.buyerAction(order.id,{contact:'buyer@example.com',action:'dispute',reason:'Delivery incomplete'},query);
  assert.equal(disputed.status,'disputed');
  assert.equal((await service.buyerAction(order.id,{contact:'buyer@example.com',action:'confirm_receipt'},query)).status,'disputed');
  await assert.rejects(pg.query("UPDATE orders SET status='released' WHERE id=$1",[order.id]));
  const held=await service.dashboard('owner',query);
  assert.equal(held.balances[0].gross_sales,'199.999998');
  assert.equal(held.balances[0].total_commission,'10.000000');
  assert.equal(held.balances[0].pending_escrow,'189.999998');

  await pg.query("INSERT INTO orders(shop_id,gross_amount,coin,network,status,tx_id,payment_verified_at) VALUES($1,100,'USDC','Polygon','released','historic1',now()-interval '10 days'),($1,20,'USDT','Base','released','historic2',now()-interval '10 days')",[shop.id]);
  await assert.rejects(service.payout('owner',{amount:'9',coin:'USDC',network:'Polygon',wallet:'0x'+'1'.repeat(40)},query));
  await assert.rejects(service.payout('stranger',{amount:'10',coin:'USDC',network:'Polygon',wallet:'0x'+'1'.repeat(40)},query));
  const redeem={amount:'60',coin:'USDC',network:'Polygon',wallet:'0x'+'1'.repeat(40)};
  const p=await service.payout('owner',redeem,query);assert.ok(p.id);
  await assert.rejects(service.payout('owner',{...redeem,amount:'36'},query));
  const dashboard=await service.dashboard('owner',query);
  assert.equal(dashboard.balances.find((b:any)=>b.coin==='USDC').available_balance,'35.000000');
  assert.equal(dashboard.balances.find((b:any)=>b.coin==='USDT').available_balance,'19.000000');
  assert.equal(dashboard.orders.length,3);assert.equal(dashboard.payouts.length,1);
  await pg.query("UPDATE payout_requests SET status='paid' WHERE id=$1",[p.id]);
  assert.equal((await service.dashboard('owner',query)).balances.find((b:any)=>b.coin==='USDC').total_redeemed,'60.000000');
 }finally{await pg.close();for(const [key,value] of [['NEXT_PUBLIC_ESCROW_WALLET',before.wallet],['NEXT_PUBLIC_ESCROW_NETWORK',before.network]]){if(value===undefined)delete env[key!];else env[key!]=value;}}
});

test('seller routes require a verified Pro identity before accessing the database',async()=>{
 const env=process.env as Record<string,string|undefined>,old={...env};
 env.NODE_ENV='production';delete env.PRO_MASTER_KEYS;delete env.GUMROAD_PRODUCT_ID;
 try{
  const dashboard=await import('../src/app/api/seller/dashboard/route');
  const payouts=await import('../src/app/api/seller/payouts/route');
  const fulfill=await import('../src/app/api/seller/orders/[id]/fulfill/route');
  const request=new Request('https://example.com/api/seller/dashboard');
  assert.equal((await dashboard.GET(request)).status,401);
  assert.equal((await payouts.POST(request)).status,401);
  assert.equal((await fulfill.POST(request,{params:Promise.resolve({id:'invalid'})})).status,401);
 }finally{for(const key of ['NODE_ENV','PRO_MASTER_KEYS','GUMROAD_PRODUCT_ID']){if(old[key]===undefined)delete env[key];else env[key]=old[key];}}
});

