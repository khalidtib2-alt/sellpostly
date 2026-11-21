import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {normalizePayments,chooseEscrow,methodReady,containsCardData,validBankAccount,paymentUrl,paymentMethods} from '../src/app/shop/payment-config';
import {translations} from '../src/app/translations';
import type {Query} from '../src/lib/order-service';

const payments=normalizePayments({TRON_USDT:{enabled:true,wallet:"TA4Wt1DUCqz6YegbnsmqsWC5uUfbdBqPxm"},BANK:{enabled:true,bank:'Bank',holder:'Independent Seller',account:'123456789012345678901234',swift:'ABCDMA22'},CARD_LINK:{enabled:true,url:'https://checkout.stripe.com/pay/seller'},PAYPAL:{enabled:true,destination:'seller@example.com'},PAYONEER:{enabled:true,destination:'https://payoneer.com/pay/seller'},WISE:{enabled:true,destination:'@seller'},USDC_DIRECT:{enabled:true,wallet:'0x'+'2'.repeat(40),network:'Polygon'},COD:{enabled:true}});
const shop=validateShop({refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',name:'Independent shop',payments,escrowGovernance:'optional_for_buyer',products:[{id:'own',name:'Product',price:'25 USD',stock:8}]});

test('payment configuration is whitelisted, safely linked, translated and preserved in share links',async()=>{
 assert.ok(validBankAccount('GB82 WEST 1234 5698 7654 32'));assert.ok(validBankAccount('123456789012345678901234'));assert.equal(validBankAccount('GB00 INVALID'),false);
 for(const url of ['javascript:alert(1)','http://merchant.example','https://localhost/x','https://127.0.0.1/x','https://user:pass@merchant.example/x'])assert.equal(paymentUrl(url),'');
 assert.equal(containsCardData({card_number:'4111111111111111'}),true);assert.equal(containsCardData({reference:'4111 1111 1111 1111'}),true);assert.equal(containsCardData({request_id:'11111111-1111-4111-8111-111111111111',phone:'+212612345678'}),false);
 assert.equal(validateShop({...shop,shopMode:'affiliate'}).payments,undefined);
 const restored=await decodeShop(await encodeShop(shop));assert.deepEqual(restored.payments,payments);assert.equal(restored.escrowGovernance,'optional_for_buyer');assert.ok(paymentMethods.every(m=>methodReady(payments,m)));
 for(const key of ['Payment Options','Seller Payment Methods','Bank Name','Account Holder Name','IBAN / 24-digit RIB','Pay by Card (External Checkout)','Enable Escrow Protection (USDC)','Pending Funding'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
 for(const method of paymentMethods)for(const policy of ['off','optional_for_buyer','required'] as const)for(const requested of [false,true])assert.equal(chooseEscrow(policy,method,requested),method==='USDC_DIRECT'&&policy!=='off'&&(policy==='required'||requested));
});

test('all direct methods have zero escrow/commission; optional and required USDC are enforced server-side; migrations rerun safely',async()=>{
 process.env.NEXT_PUBLIC_ESCROW_WALLET='0x'+'1'.repeat(40);
 const {submitPeerOrder}=await import('../src/lib/peer-order-service');const {submitOrder}=await import('../src/lib/order-service');
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{
  const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await query("INSERT INTO subscriptions(owner_key,provider) VALUES('peer-owner','master')",[]);
  await query("INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog) VALUES('peer-owner','peer-shop','Shop',$1::jsonb,$1::jsonb)",[JSON.stringify(shop)]);
  const base={slug:'peer-shop',request_id:'11111111-1111-4111-8111-111111111111',buyer:{name:'Buyer',contact:'buyer@example.com'},items:[{id:'own',quantity:2}],reference:'receipt-1'};
  for(const method of paymentMethods){const order=await submitPeerOrder({...base,reference:method==='TRON_USDT'?'b'.repeat(64):base.reference,method,escrow:method!=='USDC_DIRECT'},query);assert.equal(order.escrow_status,'NONE',method);assert.equal(order.gross_amount,'50.000000');assert.equal((await submitPeerOrder({...base,reference:method==='TRON_USDT'?'b'.repeat(64):base.reference,method,escrow:false},query)).id,order.id);const ledger=(await query('SELECT commission_rate::text,commission_amount::text,escrow_release_at FROM orders WHERE id=$1',[order.id]))[0];assert.equal(Number(ledger.commission_rate),0);assert.equal(Number(ledger.commission_amount),0);assert.equal(ledger.escrow_release_at,null);await assert.rejects(query("UPDATE orders SET status='held' WHERE id=$1",[order.id]));}
  const funded=await submitPeerOrder({...base,method:'USDC_DIRECT',escrow:true,reference:'0x'+'a'.repeat(64)},query);assert.equal(funded.governance_status,'pending_funding');assert.equal(funded.escrow_status,'PENDING_FUNDING');
  await query("UPDATE orders SET status='held',payment_verified_at=now() WHERE id=$1",[funded.id]);assert.equal((await query('SELECT escrow_status FROM orders WHERE id=$1',[funded.id]))[0].escrow_status,'HELD');
  await pg.exec(schema);await pg.exec(schema);assert.equal((await query('SELECT escrow_status FROM orders WHERE id=$1',[funded.id]))[0].escrow_status,'HELD');
  const required={...shop,escrowGovernance:'required'};await query('UPDATE shops SET catalog=$1::jsonb,personal_catalog=$1::jsonb',[JSON.stringify(required)]);
  await assert.rejects(submitPeerOrder({...base,method:'USDC_DIRECT',escrow:false,reference:'not-a-chain-hash'},query));
  const directBank=await submitPeerOrder({...base,request_id:'22222222-2222-4222-8222-222222222222',method:'BANK',escrow:true},query);assert.equal(directBank.escrow_status,'NONE');
  await assert.rejects(submitOrder({...base,coin:'USDT',network:'Polygon',tx_id:'0x'+'b'.repeat(64)},query),(e:any)=>e.code==='ESCROW_USDC_ONLY');
  await assert.rejects(submitPeerOrder({...base,method:'CARD_LINK',cvv:'123'},query),(e:any)=>e.code==='CARD_DATA_NOT_ALLOWED');
  await query('UPDATE shops SET catalog=$1::jsonb,personal_catalog=$1::jsonb',[JSON.stringify({...shop,escrowGovernance:'off'})]);await assert.rejects(submitOrder({...base,coin:'USDC',network:'Polygon',tx_id:'0x'+'c'.repeat(64)},query),(e:any)=>e.code==='ESCROW_UNAVAILABLE');
 }finally{await pg.close();}
});
