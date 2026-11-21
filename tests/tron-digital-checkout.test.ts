import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {validTronAddress,validTronTx} from '../src/app/shop/tron-data';
import {validTronChecksum} from '../src/lib/tron-validation';
import {digitalOnly,deliverySnapshot} from '../src/app/shop/digital-data';
import {normalizePayments,chooseEscrow,methodReady} from '../src/app/shop/payment-config';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {publicShop,PUBLISH_SHOP_SQL} from '../src/lib/db';
import {submitPeerOrder} from '../src/lib/peer-order-service';
import {submitCodOrder} from '../src/lib/cod-service';
import {buyerAction,fulfill,type Query} from '../src/lib/order-service';
import {translations} from '../src/app/translations';
function address(){const data=Buffer.concat([Buffer.from([65]),Buffer.alloc(20,1)]),check=createHash('sha256').update(createHash('sha256').update(data).digest()).digest().subarray(0,4);let n=BigInt('0x'+Buffer.concat([data,check]).toString('hex')),out='';const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){out=alphabet[Number(n%BigInt(58))]+out;n/=BigInt(58);}return out;}
const wallet=address();
const shop=validateShop({refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',name:'Digital store',escrowGovernance:'required',payments:{TRON_USDT:{enabled:true,wallet},COD:{enabled:true},USDC_DIRECT:{enabled:false}},products:[{id:'digital',name:'Course',category:'Digital Product',price:'25 USD',digitalDeliveryNote:'Private instructions',digitalDownloadUrl:'https://downloads.example/private-access-token'},{id:'physical',name:'Book',category:'Other',price:'30 USD'}]});

test('TRON receives structural and checksum validation and cannot request admin escrow',()=>{
 assert.ok(validTronAddress(wallet));assert.ok(validTronChecksum(wallet));assert.equal(validTronChecksum(wallet.slice(0,-1)+(wallet.endsWith('1')?'2':'1')),false);
 assert.equal(validTronAddress('0x'+'1'.repeat(40)),false);assert.ok(validTronTx('a'.repeat(64)));assert.equal(validTronTx('0x'+'a'.repeat(64)),false);assert.equal(validTronTx('fake'),false);
 const p=normalizePayments(shop.payments);assert.ok(methodReady(p,'TRON_USDT'));for(const policy of ['off','optional_for_buyer','required'] as const)assert.equal(chooseEscrow(policy,'TRON_USDT',true),false);
});

test('digital-only classification handles legacy categories, explicit flags, mixed and empty carts; snapshots omit download secrets',async()=>{
 const d={product:shop.products[0],quantity:1},p={product:shop.products[1],quantity:1};assert.ok(digitalOnly([d]));assert.equal(digitalOnly([d,p]),false);assert.equal(digitalOnly([]),false);assert.equal(digitalOnly([{...d,product:{...d.product,isDigital:false}}]),false);
 assert.equal(deliverySnapshot([d,p]).digital_items.length,1);
 const shared=await decodeShop(await encodeShop(shop));assert.equal(shared.products[0].digitalDownloadUrl,'');assert.equal(shared.products[0].digitalDeliveryNote,'');assert.equal(shared.products[0].isDigital,true);
});

test('TRON direct ledger, TxID deduplication and digital download authorization survive schema reruns',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await query("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master')",[]);await query(PUBLISH_SHOP_SQL,['owner','digital-shop','Digital','',JSON.stringify(shop)]);
 const buyer={name:'Buyer',contact:'buyer@example.com',phone:'+212612345678'},base={slug:'digital-shop',request_id:'11111111-1111-4111-8111-111111111111',buyer,items:[{id:'digital',quantity:1}],reference:'a'.repeat(64),method:'TRON_USDT',escrow:true,delivery_note:'Ignore stale address'};
 const order=await submitPeerOrder(base,query);assert.equal(order.network,'TRON');assert.equal(order.coin,'USDT');assert.equal(order.escrow_status,'NONE');assert.equal((await submitPeerOrder(base,query)).id,order.id);
 const ledger=(await query('SELECT commission_rate::text,escrow_release_at,details FROM orders WHERE id=$1',[order.id]))[0];assert.equal(Number(ledger.commission_rate),0);assert.equal(ledger.escrow_release_at,null);assert.equal(ledger.details.digital_only,true);assert.equal(ledger.details.delivery_note,'');assert.equal(ledger.details.receiving_wallet,wallet);
 await assert.rejects(submitPeerOrder({...base,request_id:'22222222-2222-4222-8222-222222222222'},query),(e:any)=>e.code==='TRANSACTION_ALREADY_SUBMITTED');
 await assert.rejects(submitPeerOrder({...base,reference:'bad'},query),(e:any)=>e.code==='INVALID_TRON_PAYMENT');
 assert.equal((await buyerAction(order.id,{contact:buyer.contact,action:'status'},query)).digital_delivery,null);
 const pub=await publicShop('digital-shop',query,'personal');assert.ok(pub?.products[0].isDigital);assert.ok(!JSON.stringify(pub).includes('private-access-token'));assert.ok(!JSON.stringify(pub).includes('Private instructions'));
 await fulfill(order.id,'owner',{delivery_notes:'Payment checked by seller'},query);
 const delivered=await buyerAction(order.id,{contact:buyer.contact,action:'status'},query);assert.equal(delivered.digital_delivery[0].download_url,shop.products[0].digitalDownloadUrl);
 await assert.rejects(buyerAction(order.id,{contact:'wrong@example.com',action:'status'},query));
 await assert.rejects(query("UPDATE orders SET status='held' WHERE id=$1",[order.id]));
 await pg.exec(schema);await pg.exec(schema);assert.equal((await buyerAction(order.id,{contact:buyer.contact,action:'status'},query)).digital_delivery[0].note,'Private instructions');
 const cod={slug:'digital-shop',request_id:'33333333-3333-4333-8333-333333333333',buyer,delivery_address:'',items:[{id:'digital',quantity:1}]};assert.ok((await submitCodOrder(cod,query)).id);
 await assert.rejects(submitCodOrder({...cod,digital_only:true,items:[{id:'physical',quantity:1}]},query));
 }finally{await pg.close();}
});

test('payment cards are vertical accessible switches and new checkout/editor copy is localized',async()=>{
 const settings=await readFile('src/app/shop/payment-settings.tsx','utf8');assert.match(settings,/flex flex-col gap-4/);assert.match(settings,/role="switch"/);assert.match(settings,/aria-checked/);assert.match(settings,/onClick=\{onSave\}/);
 const keys=Array.from(settings.matchAll(/\b(?:t|tr)\(['"]([^'"]+)['"]/g),m=>m[1]);for(const key of [...keys,'Off - direct USDC','Optional for buyer','Required for USDC'])assert.ok(key in translations,key);
 for(const key of ['TRON (USDT-TRC20)','TRON Wallet Address','Post-payment Delivery Note','Private Download Link','Digital Delivery','Check Digital Delivery'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
