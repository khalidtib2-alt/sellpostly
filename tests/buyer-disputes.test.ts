import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { buyerAction,type Query } from '../src/lib/order-service';
import { overview } from '../src/lib/admin-service';
import { polygonEscrowReady,escrowNetwork } from '../src/app/shop/escrow-config';

test('Polygon is the checkout default and incompatible receiving networks are not presented as Polygon',()=>{
 const wallet='0x'+'1'.repeat(40);
 assert.equal(escrowNetwork,'Polygon');
 assert.equal(polygonEscrowReady(wallet),true);
 assert.equal(polygonEscrowReady(wallet,'Polygon'),true);
 assert.equal(polygonEscrowReady(wallet,'Base'),false);
 assert.equal(polygonEscrowReady(wallet,'Solana'),false);
 assert.equal(polygonEscrowReady('not-an-address','Polygon'),false);
});

test('storefront disputes validate contact and store context and appear directly in admin review',async()=>{
 const pg=new PGlite();
 const query:Query=async(sql,values)=>(await pg.query(sql,values)).rows as Record<string,any>[];
 try{
  await pg.exec(await readFile('src/db/schema.sql','utf8'));
  await pg.query("INSERT INTO subscriptions(owner_key,provider) VALUES('buyer-test-owner','master'),('other-owner','master')");
  const {rows:[shop]}=await pg.query<{id:string}>("INSERT INTO shops(owner_key,slug,name) VALUES('buyer-test-owner','buyer-store','Buyer Store') RETURNING id");
  await pg.query("INSERT INTO shops(owner_key,slug,name) VALUES('other-owner','other-store','Other Store')");
  const buyer={name:'Buyer',contact:'buyer@example.com'};
  const create=async(tx:string)=>(await pg.query<{id:string}>("INSERT INTO orders(shop_id,gross_amount,coin,network,status,tx_id,payment_verified_at,details) VALUES($1,40,'USDC','Polygon','held',$2,now(),$3::jsonb) RETURNING id",[shop.id,tx,JSON.stringify({buyer,items:[{id:'item-1',name:'Digital guide',quantity:1}]})])).rows[0].id;
  const id=await create('0x'+'7'.repeat(64));
  await assert.rejects(buyerAction(id,{action:'dispute',storeSlug:'buyer-store',contact:'wrong@example.com',reason:'Missing'},query));
  await assert.rejects(buyerAction(id,{action:'dispute',storeSlug:'other-store',contact:buyer.contact,reason:'Missing'},query));
  assert.equal((await pg.query<{status:string}>('SELECT status FROM orders WHERE id=$1',[id])).rows[0].status,'held');
  const sharedId=await create('0x'+'8'.repeat(64));
  await pg.query('UPDATE shops SET suspended=true WHERE id=$1',[shop.id]);
  const reason='Product has not arrived.\nPlease review my payment and delivery.';
  const result=await buyerAction(id,{action:'dispute',storeSlug:'buyer-store',contact:'BUYER@example.com',reason},query);
  assert.equal(result.status,'disputed');
  const admin=await overview(query);
  const visible=admin.orders.find((order:any)=>order.id===id);
  assert.equal(visible.status,'disputed');assert.equal(visible.shop_name,'Buyer Store');assert.equal(visible.details.dispute.reason,reason);
  assert.ok(visible.details.dispute.opened_at);
  assert.equal(visible.details.items[0].name,'Digital guide');
  assert.equal(admin.orders.filter((order:any)=>order.status==='disputed').length,1);
  assert.equal((await buyerAction(sharedId,{contact:buyer.contact,reason:'Shared buyer link report'},query)).status,'disputed');
 }finally{await pg.close();}
});

test('public dispute route bounds request bodies before database access',async()=>{
 const {POST}=await import('../src/app/api/orders/[id]/dispute/route');
 const response=await POST(new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:'x'.repeat(9000)})}),{params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})});
 assert.equal(response.status,413);
});

