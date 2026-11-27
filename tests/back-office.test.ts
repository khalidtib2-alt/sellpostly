import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {migrateSchema,splitSql} from '../src/db/migrate-schema.mjs';
import {createManualReceipt,readBackOffice,readInvoice,recordStorefrontVisit,saveCustomerProfile,reportRange} from '../src/lib/back-office-service';
import {aggregateCustomers,analyticsCsv,analyticsReport,canExportReports} from '../src/lib/back-office-report';
import {validateShop} from '../src/app/shop/shop-data';
import type {Sale} from '../src/app/dashboard/back-office-data';
import type {Query} from '../src/lib/order-service';

test('SQL scanner preserves dollar quotes, escaped strings, identifiers and nested comments',()=>{
 const sample=[
  '-- a fake ; delimiter',
  'CREATE FUNCTION f() RETURNS void AS $body$ BEGIN PERFORM 1; END; $body$ LANGUAGE plpgsql;',
  '/* one; /* two; */ still comment ; */ SELECT E\'a\\\'b;c\', \'two\'\'words;\', "id;";',
  'SELECT $$a;b$$, $1; -- trailing;',
 ].join('\n');
 const result=splitSql(sample);
 assert.equal(result.length,3);
 assert.match(result[0],/PERFORM 1; END;/);
 assert.match(result[1],/still comment/);
 assert.match(result[2],/\$\$a;b\$\$/);
 assert.throws(()=>splitSql("SELECT 'unclosed;"),/UNTERMINATED_SCHEMA_SQL/);
});

function migrationAdapter(pg:PGlite){
 const sql={
  query(statement:string,args:unknown[]=[]){
   return {statement,args,then(onfulfilled:(rows:unknown[])=>unknown,onrejected:(error:unknown)=>unknown){
    return pg.query(statement,args).then(result=>onfulfilled(result.rows),onrejected);
   }};
  },
  async transaction(entries:{statement:string;args:unknown[]}[]){
   await pg.transaction(async tx=>{
    for(const entry of entries)await tx.query(entry.statement,entry.args);
   });
  },
 };
 return sql as unknown as Parameters<typeof migrateSchema>[0];
}

const sample=(id:string,fields:Partial<Sale>={}):Sale=>({
 id,shop_id:'shop-a',store_name:'Studio',invoice_number:'INV-2026-'+id,source:'storefront',status:'fulfilled',payment_method:'COD',
 coin:'USD',gross_amount:'25.000000',shipping_amount:'2.000000',discount_amount:'1.000000',created_at:'2026-11-27T10:00:00Z',
 details:{buyer:{name:'Ana',phone:'+33 6 12 34 56 78'},items:[{id:'tee',name:'Shirt',quantity:2,variantId:'s-black',variantLabel:'S / Black',unit_price:'12.00',line_total:'24.00'}]},
 ...fields,
});

test('CRM joins normalized phone and email aliases per shop and analytics keep currencies separate',()=>{
 const sales=[
  sample('one'),
  sample('two',{source:'manual',coin:'MAD',payment_method:'BANK',details:{manual_paid:true,buyer:{name:'Ana',phone:'0033612345678',contact:'ANA@EXAMPLE.COM',city:'Paris'}}}),
  sample('three',{status:'pending',created_at:'2026-11-28T10:00:00Z',details:{buyer:{contact:'ana@example.com'}}}),
  sample('four',{shop_id:'shop-b'}),
 ];
 const buyers=aggregateCustomers(sales);
 assert.equal(buyers.length,2);
 const buyer=buyers.find(row=>row.shopId==='shop-a')!;
 assert.equal(buyer.orders,3);
 assert.equal(buyer.email,'ana@example.com');
 assert.equal(buyer.city,'Paris');
 assert.deepEqual(buyer.spent.map(row=>row.currency).sort(),['MAD','USD']);
 const report=analyticsReport(sales,4,1);
 assert.equal(report.conversion,.25);
 assert.equal(report.pendingCod,1);
 assert.ok(analyticsCsv('orders',sales,buyers,report).includes('"S / Black"'));
 assert.ok(analyticsCsv('revenue',sales,buyers,report).includes('"gross_revenue","","MAD","25.000000"'));
 assert.ok(analyticsCsv('customers',sales,buyers,report).includes('"ana@example.com"'));
 assert.throws(()=>reportRange(new URLSearchParams({period:'custom',from:'2026-02-30',to:'2026-03-01'})),{code:'INVALID_RANGE'});
 assert.equal(canExportReports('pro',true),false);
 assert.equal(canExportReports('b2b',true),true);
});

test('prepared migration applies once, manual receipts reserve stock, and B2B unlocks consolidated exports and unbranded invoices',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as Awaited<ReturnType<Query>>;
 try {
  const schema=await readFile('src/db/schema.sql','utf8'),adapter=migrationAdapter(pg);
  assert.equal((await migrateSchema(adapter,schema)).applied,true);
  assert.equal((await migrateSchema(adapter,schema)).applied,false);
  assert.equal((await migrateSchema(adapter,schema+'\n-- compatible rerun')).applied,true);
  await pg.exec("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('free','free')");
  const shop=validateShop({name:'Studio',shopMode:'personal',logo:'https://example.com/logo.png',products:[
   {id:'tee',name:'Shirt',price:'25 USD',variants:[{id:'s-black',size:'S',color:'Black',sku:'SB',stockCount:5}]},
  ]});
  const [row]=await query("INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog) VALUES('owner','shirt-studio','Studio',$1::jsonb,$1::jsonb) RETURNING id",[JSON.stringify(shop)]);
  const payload={shopId:row.id,requestId:'11111111-1111-4111-8111-111111111111',buyer:{name:'Ana',phone:'+33612345678',email:'ana@example.com',city:'Paris'},
   method:'CASH',paid:true,currency:'EUR',shipping:'5.20',discount:'1.10',items:[{id:'tee',variantId:'s-black',unitPrice:'10.50',quantity:2}]};
  const receipt=await createManualReceipt('owner',payload,query);
  assert.match(receipt.invoice_number,/^INV-\d{4}-\d{4,}$/);
  assert.equal((await createManualReceipt('owner',payload,query)).id,receipt.id);
  const [movement]=await query("SELECT delta,variant_id FROM stock_movements WHERE order_id=$1 AND reason='order'",[receipt.id]);
  assert.deepEqual(movement,{delta:-2,variant_id:'s-black'});
  const [stock]=await query("SELECT personal_catalog->'products'->0->>'stock' AS stock FROM shops WHERE id=$1",[row.id]);
  assert.equal(stock.stock,'3');
  await assert.rejects(createManualReceipt('owner',{...payload,requestId:'22222222-1111-4111-8111-111111111111',items:[{...payload.items[0],quantity:4}]},query),/OUT_OF_STOCK/);
  const invoice=await readInvoice('owner',receipt.id,query);
  assert.equal(invoice.seller.logo,shop.logo);
  assert.equal(invoice.sale.gross_amount,'25.100000');
  assert.equal(invoice.sale.details.items?.[0].color,'Black');
  assert.equal(invoice.hideBrand,false);
  await assert.rejects(readInvoice('free',receipt.id,query),{status:404});
  const crm=await readBackOffice('owner',new URLSearchParams('view=customers'),query);
  const customer=crm.customers?.[0];
  assert.equal(customer?.city,'Paris');
  await saveCustomerProfile('owner',{shopId:row.id,key:customer?.key,tags:['vip','confirm'],note:'Side entrance'},query);
  assert.equal((await readBackOffice('owner',new URLSearchParams('view=customers'),query)).customers?.[0].note,'Side entrance');
  const storefrontVisitor='33333333-1111-4111-8111-111111111111';
  await recordStorefrontVisit({slug:'shirt-studio',visitorId:storefrontVisitor},query);
  await recordStorefrontVisit({slug:'shirt-studio',visitorId:storefrontVisitor},query);
  await query("INSERT INTO orders(shop_id,gross_amount,coin,network,payment_method,escrow_status,details) VALUES($1,20,'USD','COD','COD','NONE',$2::jsonb)",[row.id,JSON.stringify({visitor_id:storefrontVisitor,buyer:{contact:'ANA@example.com'}})]);
  const report=await readBackOffice('owner',new URLSearchParams('view=analytics'),query);
  assert.equal(report.report?.conversion,1);
  await assert.rejects(readBackOffice('free',new URLSearchParams('view=analytics&export=orders'),query),{status:403});
  await assert.rejects(readBackOffice('owner',new URLSearchParams('view=analytics&shopId=all&export=orders'),query),{status:403});
  const key='SP-PRO-'+'B'.repeat(64);
  await query(`INSERT INTO pro_upgrade_requests(email,plan,amount_usd,coin,tx_id,status,issued_license_key,receipt_token_hash,approved_at)
   VALUES('seller@example.com','b2b',49,'USDC',$1,'approved',$2,$3,now())`,['0x'+'a'.repeat(64),key,'a'.repeat(64)]);
  await query("UPDATE subscriptions SET plan_source=encode(sha256(convert_to('sellpostly-license:'||$1,'UTF8')),'hex') WHERE owner_key='owner'",[key]);
  assert.equal((await readInvoice('owner',receipt.id,query)).hideBrand,true);
  const [second]=await query(`INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog,store_mode,shop_type,niche_name)
   VALUES('owner','studio-outlet','Outlet',$1::jsonb,$1::jsonb,'niche','personal','Outlet') RETURNING id`,[JSON.stringify({...shop,name:'Outlet'})]);
  await createManualReceipt('owner',{...payload,shopId:second.id},query);
  const exported=await readBackOffice('owner',new URLSearchParams('view=analytics&shopId=all&export=orders'),query);
  assert.ok(exported.csv?.includes('"S / Black"'));
  assert.ok(exported.csv?.includes('"Outlet"'));
 } finally {await pg.close();}
});

test('invoice markup contains shop logo, itemized variant and B2B branding rules',()=>{
 const script=`
 import assert from 'node:assert/strict';
 import React from 'react';
 import {renderToStaticMarkup} from 'react-dom/server';
 import {LanguageProvider} from './src/app/language-context.tsx';
 import InvoiceDocument from './src/app/dashboard/invoice-document.tsx';
 const sale=${JSON.stringify(sample('0001',{coin:'USDC'}))};
 const render=hideBrand=>renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(InvoiceDocument,{invoice:{sale,paid:true,hideBrand,seller:{name:'Studio',logo:'https://example.com/logo.png',email:'sales@example.com',phone:'',slug:'studio'}}})));
 const branded=render(false);
 assert.match(branded,/logo.png/);assert.ok(branded.includes('S / Black'));assert.match(branded,/INV-2026-0001/);assert.match(branded,/USDC/);assert.match(branded,/Created with SellPostly/);
 assert.doesNotMatch(render(true),/Created with SellPostly/);
 `;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);
});
