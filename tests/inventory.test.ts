import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {readInventory,restoreSellerOrder,formatInventoryCsv} from '../src/lib/inventory-service';
import {submitCodOrder} from '../src/lib/cod-service';
import {priceItems} from '../src/lib/order-validation';
import {validateShop} from '../src/app/shop/shop-data';
import {catalogCartLines,cartLineKey,moveCartVariant,checkoutItem} from '../src/app/shop/cart-data';
import type {Query} from '../src/lib/order-service';

const catalog=validateShop({name:'Variant shop',shopMode:'personal',refundPolicy:'7_day',deliveryTimeframe:'Within three days',products:[
 {id:'shirt',name:'Tee, "classic"',price:'15 USD',variants:[
  {id:'small-black',size:'S',color:'Black',sku:'=formula',stockCount:3},
  {id:'large-white',size:'L',color:'White',sku:'TS-L',stockCount:5},
 ]},
]});

test('cart lines and pricing keep size/color combinations distinct',()=>{
 const product=catalog.products[0];
 assert.equal(product.stock,8);
 const lines=catalogCartLines([product],{shirt:1,[cartLineKey('shirt','small-black')]:1});
 const moved=moveCartVariant({shirt:1,[cartLineKey('shirt','small-black')]:1},lines[0],'large-white');
 const items=catalogCartLines([product],moved).map(checkoutItem);
 assert.deepEqual(items,[{id:'shirt',variantId:'small-black',quantity:1},{id:'shirt',variantId:'large-white',quantity:1}]);
 assert.equal(priceItems([product],items,'USDC').gross,'30.000000');
 assert.throws(()=>priceItems([product],[{id:'shirt',quantity:1}],'USDC'),{code:'INVALID_VARIANT'});
 assert.throws(()=>priceItems([product],[{id:'shirt',variantId:'small-black',quantity:4}],'USDC'),{code:'OUT_OF_STOCK'});
});

test('COD orders reserve the exact variant, retries do not double-decrement, and returns and adjustments are audited',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as Awaited<ReturnType<Query>>;
 try{
  const schema=await readFile('src/db/schema.sql','utf8');
  await pg.exec(schema);
  await pg.exec("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('other','free')");
  const [shop]=await query("INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog) VALUES('owner','variant-shop','Variant shop',$1::jsonb,$1::jsonb) RETURNING id",[JSON.stringify(catalog)]);
  const read=async()=>(await query('SELECT personal_catalog FROM shops WHERE id=$1',[shop.id]))[0].personal_catalog;
  const order={slug:'variant-shop',request_id:'11111111-1111-4111-8111-111111111111',buyer:{name:'Buyer',contact:'buyer@example.com',phone:'+1 555 123 4567'},
   delivery_address:'200 Cedar Street',items:[{id:'shirt',variantId:'small-black',quantity:3}]};
  const receipt=await submitCodOrder(order,query);
  assert.equal((await submitCodOrder(order,query)).id,receipt.id);
  assert.equal((await read()).products[0].stock,5);
  assert.deepEqual((await read()).products[0].variants.map((row:{stockCount:number})=>row.stockCount),[0,5]);
  await assert.rejects(submitCodOrder({...order,request_id:'22222222-1111-4111-8111-111111111111'},query),/OUT_OF_STOCK/);
  await assert.rejects(submitCodOrder({...order,request_id:'33333333-1111-4111-8111-111111111111',
   items:[{id:'shirt',variantId:'large-white',quantity:1},{id:'shirt',variantId:'small-black',quantity:1}]},query),/OUT_OF_STOCK/);
  assert.deepEqual((await read()).products[0].variants.map((row:{stockCount:number})=>row.stockCount),[0,5],'an invalid line rolls back the entire order');
  const write=(value:unknown)=>query('UPDATE shops SET catalog=$2::jsonb,personal_catalog=$2::jsonb WHERE id=$1',[shop.id,JSON.stringify(value)]);
  await write({...catalog,bio:'Updated description'});
  assert.equal((await read()).products[0].stock,5,'saving a stale product draft preserves current stock');
  await assert.rejects(write({...catalog,products:[{...catalog.products[0],inventoryVersion:0,inventoryEdit:{id:'stale',reason:'restock'}}]}),/INVENTORY_CONFLICT/);
  await assert.rejects(restoreSellerOrder('other',receipt.id,'cancel','',query),{code:'ORDER_NOT_FOUND_OR_NOT_ELIGIBLE'});
  await restoreSellerOrder('owner',receipt.id,'cancel','Cancelled before shipment',query);
  await assert.rejects(restoreSellerOrder('owner',receipt.id,'cancel','duplicate',query),{code:'ORDER_NOT_FOUND_OR_NOT_ELIGIBLE'});
  assert.equal((await read()).products[0].stock,8);
  const current=await read(),product=current.products[0];
  product.variants[0].stockCount=7;product.stock=12;
  product.inventoryEdit={id:'restock-one',reason:'restock',note:'New shipment'};
  await write(current);
  await write(current);
  await pg.exec(schema);
  const history=await readInventory('owner',new URLSearchParams({shopId:shop.id}),query);
  assert.ok('movements' in history);
  assert.deepEqual(history.movements?.map(row=>[row.reason,row.delta]).sort(),[
   ['initial',3],['initial',5],['order',-3],['restock',4],['return',3],
  ].sort());
  assert.equal(history.movements?.find(row=>row.reason==='return')?.note,'Cancelled before shipment');
  const filtered=await readInventory('owner',new URLSearchParams({reason:'restock',search:'Black'}),query);
  assert.equal(filtered.movements?.length,1);
  await assert.rejects(readInventory('other',new URLSearchParams({shopId:shop.id}),query),{code:'SHOP_NOT_FOUND'});
  await assert.rejects(readInventory('other',new URLSearchParams({format:'csv'}),query),{code:'INVENTORY_EXPORT_PRO_REQUIRED'});
  const exported=await readInventory('owner',new URLSearchParams({shopId:shop.id,format:'csv'}),query);
  assert.ok(exported.csv?.includes('"New shipment"'));
  const shipped=await submitCodOrder({...order,request_id:'44444444-1111-4111-8111-111111111111',items:[{id:'shirt',variantId:'large-white',quantity:2}]},query);
  await query("UPDATE orders SET status='fulfilled' WHERE id=$1",[shipped.id]);
  await restoreSellerOrder('owner',shipped.id,'return','Returned to shelf',query);
  assert.deepEqual((await read()).products[0].variants.map((row:{stockCount:number})=>row.stockCount),[7,5]);

  const key='SP-PRO-'+'A'.repeat(64);
  await query(`INSERT INTO pro_upgrade_requests(email,plan,amount_usd,coin,tx_id,status,issued_license_key,receipt_token_hash,approved_at)
   VALUES('seller@example.com','monthly',19,'USDC',$1,'approved',$2,$3,now())`,['0x'+'a'.repeat(64),key,'a'.repeat(64)]);
  await query("UPDATE subscriptions SET plan_source=encode(sha256(convert_to('sellpostly-license:'||$1,'UTF8')),'hex') WHERE owner_key='owner'",[key]);
  assert.equal((await readInventory('owner',new URLSearchParams(),query)).canExport,true);
  await pg.exec("UPDATE pro_upgrade_requests SET plan='b2b'");
  assert.equal((await readInventory('owner',new URLSearchParams(),query)).canExport,true);
  await pg.exec("UPDATE pro_upgrade_requests SET plan='lifetime'");
  await assert.rejects(readInventory('owner',new URLSearchParams({format:'csv'}),query),{code:'INVENTORY_EXPORT_PRO_REQUIRED'});
  await pg.exec("UPDATE pro_upgrade_requests SET plan='b2b'");
  await pg.exec("UPDATE subscriptions SET plan_override='free' WHERE owner_key='owner'");
  await assert.rejects(readInventory('owner',new URLSearchParams({format:'csv'}),query),{code:'INVENTORY_EXPORT_PRO_REQUIRED'});
  assert.equal((await readInventory('owner',new URLSearchParams(),query)).canExport,false);
 }finally{await pg.close();}
});

test('CSV escapes quotes, commas, newlines and formula-like cells',()=>{
 const csv=formatInventoryCsv(catalog,[{id:'log',product_id:'shirt',product_name:'Tee, "classic"',variant_id:'small-black',
  variant_label:'S / Black',sku:'=formula',delta:-2,reason:'order',note:'First line\nSecond "line"',created_at:'2026-11-27T12:30:00Z',order_id:'order'}]);
 assert.ok(csv.startsWith('\uFEFF"record_type"'));
 assert.ok(csv.includes('"Tee, ""classic"""'));
 assert.ok(csv.includes('"\x27=formula"'));
 assert.ok(csv.includes('"-2","order","First line\nSecond ""line"""'));
 assert.ok(csv.includes('\r\n"movement"'));
});
