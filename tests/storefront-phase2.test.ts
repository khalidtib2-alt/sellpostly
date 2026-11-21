import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {PUBLISH_SHOP_SQL,publicShop} from '../src/lib/db';
import {validateShop} from '../src/app/shop/shop-data';
import {submitCodOrder} from '../src/lib/cod-service';
import {notifyEvent} from '../src/lib/notifications';
import {updateOrder,overview} from '../src/lib/admin-service';
import {emailTemplate} from '../src/lib/email';
import {storePath} from '../src/app/shop/product-links';
import {translations} from '../src/app/translations';
import type {Query} from '../src/lib/order-service';

test('independent published catalogs, COD ledger isolation and buyer/seller lifecycle notifications',async()=>{
 const pg=new PGlite(),old={...process.env},messages:any[]=[];
 const query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 const request:typeof fetch=async(_url,options)=>{messages.push(JSON.parse(String(options?.body)));return Response.json({id:'mock-resend'});};
 process.env.RESEND_API_KEY='mock-only';process.env.NEXT_PUBLIC_ESCROW_WALLET='0x'+'1'.repeat(40);process.env.NEXT_PUBLIC_ESCROW_NETWORK='Polygon';
 try{
  const {submitOrder,fulfill,buyerAction,dashboard}=await import('../src/lib/order-service');
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
  await query("INSERT INTO subscriptions(owner_key,provider,email,language) VALUES('owner2','master','seller@example.com','fr'),('outsider','master','other@example.com','en')",[]);
  const item=(id:string,mode:'affiliate'|'personal')=>({id,name:'Product '+id,price:'20 USD',image:'',url:mode==='affiliate'?'https://amazon.com/dp/TEST':'',source:'Other',gender:'unisex',category:'Other',catalogMode:mode});
  const affiliate=validateShop({name:'Deals',shopMode:'affiliate',heroTitle:'Curated by us',shopAccent:'amber',products:[item('deal','affiliate')]});
  const personal=validateShop({name:'Owned',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',cryptoWallet:'0x'+'2'.repeat(40),sellerEmail:'seller@example.com',codEnabled:true,escrowEnabled:true,products:[item('owned','personal')]});
  const publish=(shop:unknown)=>query(PUBLISH_SHOP_SQL,['owner2','phase2-store','Store','',JSON.stringify(shop)]);
  await publish(affiliate);assert.equal((await publicShop('phase2-store',query,'personal'))?.products.length,0);assert.equal((await publicShop('phase2-store',query,'personal'))?.heroTitle,'');assert.equal((await publicShop('phase2-store',query,'personal'))?.shopAccent,'emerald');await publish(personal);await publish(affiliate);
  assert.equal((await publicShop('phase2-store',query,'affiliate'))?.products[0].id,'deal');
  const own=await publicShop('phase2-store',query,'personal');assert.equal(own?.products[0].id,'owned');assert.equal(own?.cryptoWallet,personal.cryptoWallet);
  assert.equal(storePath('phase2-store','personal'),'/s/phase2-store/personal');assert.notEqual(storePath('phase2-store','affiliate'),storePath('phase2-store','personal'));
  const shop=(await query("SELECT id FROM shops WHERE owner_key='owner2'",[]))[0];
  const codInput={slug:'phase2-store',request_id:'11111111-1111-4111-8111-111111111111',buyer:{name:'Buyer',contact:'buyer@example.com',phone:'+212612345678'},delivery_address:'Street 1, Casablanca',items:[{id:'owned',quantity:2}],language:'ar',gross_amount:'0.01',escrow_status:'HELD'};
  const cod=await submitCodOrder(codInput,query);assert.equal(cod.gross_amount,'40.000000');assert.equal(cod.payment_method,'COD');assert.equal(cod.escrow_status,'NONE');
  assert.equal((await submitCodOrder(codInput,query)).id,cod.id);
  const recorded=(await query('SELECT * FROM orders WHERE id=$1',[cod.id]))[0];assert.equal(recorded.commission_amount,'0.000000');assert.equal(recorded.net_amount,'40.000000');assert.equal(recorded.escrow_release_at,null);assert.equal(recorded.payment_verified_at,null);
  await assert.rejects(query("UPDATE orders SET status='held',tx_id='fake',payment_verified_at=now() WHERE id=$1",[cod.id]));
  await assert.rejects(query("UPDATE orders SET payment_method='CRYPTO' WHERE id=$1",[cod.id]));
  await assert.rejects(query("SELECT request_seller_payout($1,'owner2',10,'USDC','Polygon',$2)",[shop.id,personal.cryptoWallet]));
  await assert.rejects(submitCodOrder({...codInput,request_id:'22222222-2222-4222-8222-222222222222',items:[{id:'deal',quantity:1}]},query));
  await notifyEvent('cod_buyer',cod.id,query,request);await notifyEvent('cod_seller',cod.id,query,request);await notifyEvent('cod_seller',cod.id,query,request);
  assert.equal(messages.length,2);assert.deepEqual(messages[0].to,['buyer@example.com']);assert.deepEqual(messages[1].to,['seller@example.com']);assert.equal(messages[0].reply_to,'sellpostly.support@gmail.com');assert.ok(messages[0].html.includes('dir="rtl"'));assert.ok(messages[1].html.includes('Street 1'));
  await assert.rejects(fulfill(cod.id,'outsider',{tracking:'WRONG'},query));
  const shipped=await fulfill(cod.id,'owner2',{tracking:'TRACK-ONE',carrier:'DHL',delivery_notes:'Dispatched'},query);assert.equal(shipped.status,'fulfilled');
  await notifyEvent('delivered',cod.id,query,request);assert.ok(messages.at(-1).html.includes('TRACK-ONE'));assert.ok(messages.at(-1).html.includes('DHL'));
  await fulfill(cod.id,'owner2',{tracking:'TRACK-TWO',carrier:'UPS'},query);await notifyEvent('delivered',cod.id,query,request);assert.ok(messages.at(-1).html.includes('TRACK-TWO'));
  assert.equal((await dashboard('owner2',query)).balances.length,0);
  assert.equal((await dashboard('owner2',query)).orders[0].payment_method,'COD');
  const crypto=await submitOrder({slug:'phase2-store',coin:'USDC',network:'Polygon',tx_id:'0x'+'a'.repeat(64),buyer:{name:'Buyer',contact:'buyer@example.com'},items:[{id:'owned',quantity:1}]},query);
  await updateOrder(crypto.id,{action:'verify'},query);
  await notifyEvent('held',crypto.id,query,request);await notifyEvent('seller_held',crypto.id,query,request);
  assert.deepEqual(messages.at(-2).to,['buyer@example.com']);assert.deepEqual(messages.at(-1).to,['seller@example.com']);
  await assert.rejects(updateOrder(crypto.id,{action:'release'},query));
  await buyerAction(crypto.id,{contact:'buyer@example.com',action:'confirm_receipt'},query);await updateOrder(crypto.id,{action:'release',forceRelease:true},query);
  await notifyEvent('released',crypto.id,query,request);assert.ok(messages.at(-1).html.includes(personal.cryptoWallet!));assert.deepEqual(messages.at(-1).to,['seller@example.com']);
  const admin=await overview(query),adminOrder=admin.orders.find((o:any)=>o.id===crypto.id);assert.equal(adminOrder.seller_wallet,personal.cryptoWallet);assert.equal(adminOrder.buyer_email,'buyer@example.com');
  assert.equal((await dashboard('owner2',query)).balances[0].available_balance,'19.000000');
  await query('UPDATE shops SET cod_enabled=false WHERE id=$1',[shop.id]);
  await assert.rejects(submitCodOrder({...codInput,request_id:'33333333-3333-4333-8333-333333333333'},query));
  assert.equal((await publicShop('phase2-store',query,'personal'))?.codEnabled,false);
  // Reinitialization also succeeds with existing COD records.
  await pg.exec(schema);
 }finally{for(const key of ['RESEND_API_KEY','NEXT_PUBLIC_ESCROW_WALLET','NEXT_PUBLIC_ESCROW_NETWORK']){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}await pg.close();}
});
test('all Phase 2 messages localize and escape payment/tracking data',()=>{
 for(const language of ['en','fr','ar'])for(const kind of ['seller_held','released','cod_buyer','cod_seller','delivered'] as const){const template=emailTemplate({kind,language,id:'id',tracking:'<script>bad</script>',carrier:'DHL',wallet:'0x123',notes:'<img src=x>',days:7});assert.ok(template.subject);assert.ok(!template.html.includes('<script>'));assert.ok(!template.html.includes('<img src=x>'));assert.ok(template.html.includes(language==='ar'?'dir="rtl"':'dir="ltr"'));}
 for(const key of ['Affiliate Store Link','Personal Store Link','Seller USDC Wallet Address (Polygon)','Place COD Order','Shipping Carrier','Confirm Funds Arrived','Release Escrow Funds'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
