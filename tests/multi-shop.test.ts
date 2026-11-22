import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createNicheShop,listSellerShops,saveNicheShop} from '../src/lib/multi-shop-service';
import {PUBLISH_SHOP_SQL,publicShop} from '../src/lib/db';
import {dashboard} from '../src/lib/order-service';
import type {Query} from '../src/lib/order-service';
import {validateShop,encodeShop,decodeShop,shopKey} from '../src/app/shop/shop-data';
import {persistShop,readShopList,switchShop,shopSelection,shopDraftKey} from '../src/app/shop/multi-shop-data';
import {consumePending,pendingShopKey} from '../src/lib/shop-handoff';
import {translations} from '../src/app/translations';

test('legacy primary catalogs migrate intact; niche shops enforce global slugs, ownership, type and 10-shop Pro limit',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{
 const schema=await readFile('src/db/schema.sql','utf8'),legacy=schema.split('-- statement-breakpoint\nCREATE TABLE IF NOT EXISTS shop_account_links')[0];
 await pg.exec(legacy);
 await query("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('other','master'),('free','free')",[]);
 const personal=validateShop({refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',name:'Legacy Personal',products:[{id:'p',name:'Own product',price:'75 USD',category:'Fashion'}],payments:{COD:{enabled:true}},escrowGovernance:'off'}),affiliate=validateShop({shopMode:'affiliate',name:'Legacy Deals',affiliateDisclosure:'Custom disclosure',products:[{id:'a',name:'Deal',url:'https://example.com/deal',price:'20 USD',image:'https://example.com/a.jpg'}]});
 const primary=(await query("INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog,affiliate_catalog,affiliate_disclosure) VALUES('owner','legacy-store','Legacy',$1::jsonb,$1::jsonb,$2::jsonb,'Custom disclosure') RETURNING id",[JSON.stringify(personal),JSON.stringify(affiliate)]))[0];
 await pg.exec(schema);await pg.exec(schema);
 const list=await listSellerShops('owner',query);assert.equal(list.length,2);assert.deepEqual(list.map(s=>s.customSlug),['legacy-store','legacy-store']);assert.equal(list.find(s=>s.shopMode==='personal')?.products[0].id,'p');assert.equal(list.find(s=>s.shopMode==='affiliate')?.affiliateDisclosure,'Custom disclosure');assert.equal(list.find(s=>s.shopMode==='personal')?.payments?.COD.enabled,true);
 const created=[];
 for(let i=0;i<10;i++)created.push(await createNicheShop('owner',{name:'Specialty '+i,refundPolicy:'7_day',deliveryTimeframe:'2 days',shopMode:i%2?'affiliate':'personal',customSlug:'specialty-'+i,nicheName:i%2?'Kitchen Finds':'Running Shoes',bio:'Focused collection'},query));
 await assert.rejects(createNicheShop('owner',{name:'Extra',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',customSlug:'specialty-extra',nicheName:'Extra'},query),/NICHE_LIMIT_REACHED/);
 await assert.rejects(createNicheShop('other',{name:'Duplicate',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',customSlug:'specialty-0',nicheName:'Extra'},query),/SLUG_UNAVAILABLE/);
 await assert.rejects(createNicheShop('free',{name:'Free niche',shopMode:'affiliate',customSlug:'free-niche',nicheName:'Free'},query),/PRO_REQUIRED/);
 await query(PUBLISH_SHOP_SQL,['free','free-primary','Free','',JSON.stringify(personal)]);await query(PUBLISH_SHOP_SQL,['free','ignored-primary','Free deals','',JSON.stringify(affiliate)]);
 assert.equal((await listSellerShops('free',query)).length,2);
 await assert.rejects(saveNicheShop('other',created[0],query),/SHOP_NOT_FOUND/);
 await assert.rejects(saveNicheShop('owner',{...created[0],shopMode:'affiliate'},query),/SHOP_NOT_FOUND/);
 await saveNicheShop('owner',{...created[0],products:personal.products,escrowHoldDays:15,payments:personal.payments},query);
 const published=await publicShop('specialty-0',query,'personal');assert.equal(published?.storeMode,'niche');assert.equal(published?.nicheName,'Running Shoes');assert.equal(published?.escrowHoldDays,7);assert.equal(published?.products[0].id,'p');assert.equal(await publicShop('specialty-0',query,'affiliate'),null);
 await pg.exec(schema);assert.equal(await publicShop('specialty-0',query,'affiliate'),null);
 const report=await dashboard('owner',query,created[0].shopId);assert.equal(report.shop.id,created[0].shopId);assert.equal((await dashboard('other',query,created[0].shopId)).shop,null);
 // Existing general primary remains the same row after additional shops are published.
 await query(PUBLISH_SHOP_SQL,['owner','unused-new-slug','Renamed','',JSON.stringify(personal)]);
 assert.equal((await query("SELECT id FROM shops WHERE owner_key='owner' AND store_mode='general'",[]))[0].id,primary.id);
 // Upgrading a free account adds an entitlement link without moving any shop IDs or URLs.
 await query("INSERT INTO shop_account_links(pro_owner,account_owner) VALUES('other','free')",[]);
 await createNicheShop('free',{name:'Upgraded',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',customSlug:'upgraded-niche',nicheName:'Art'},query);
 assert.equal((await listSellerShops('free',query)).length,3);
 }finally{await pg.close();}
});

test('independent drafts, settings, compressed links and exact-shop imports preserve catalog boundaries',async()=>{
 const map=new Map<string,string>(),storage={getItem:(key:string)=>map.get(key)||null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};
 const p=validateShop({name:'Primary',refundPolicy:'7_day',deliveryTimeframe:'Delivery within 2-3 business days',shopMode:'personal',products:[{id:'old',name:'Old',price:'25 USD'}]}),a=validateShop({name:'Deals',shopMode:'affiliate',affiliateDisclosure:'Own disclosure',products:[]}),n=validateShop({shopId:'11111111-1111-4111-8111-111111111111',customSlug:'sneaker-edit',storeMode:'niche',nicheName:'Running Sneakers',name:'Sneakers',shopMode:'affiliate',affiliateDisclosure:'Niche disclosure',products:[]});
 persistShop(p,storage);persistShop(a,storage);persistShop(n,storage);assert.notEqual(shopDraftKey(n),shopDraftKey(a));
 const selected=switchShop(n,p,storage);assert.equal(selected.products[0].id,'old');assert.equal(readShopList(storage).length,3);
 storage.setItem(pendingShopKey,JSON.stringify({id:'amazon-import',title:'Nike Running Sneakers',price:'75 USD',url:'https://amazon.com/dp/B012345678',image:'https://m.media-amazon.com/images/I/photo.jpg',destination:'affiliate',targetShopId:n.shopId,category:'Fashion'}));
 const result=consumePending(selected,storage);assert.equal(shopSelection(result.shop),shopSelection(n));assert.equal(result.category,'All');assert.equal(result.shop.products[0].category,'Running Sneakers');assert.match(result.shop.products[0].image,/media-amazon/);assert.equal(JSON.parse(storage.getItem(shopDraftKey(p))!).products.length,1);assert.equal(JSON.parse(storage.getItem(shopDraftKey(a))!).products.length,0);
 const restored=await decodeShop(await encodeShop(result.shop));assert.equal(restored.storeMode,'niche');assert.equal(restored.customSlug,'sneaker-edit');assert.equal(restored.affiliateDisclosure,'Niche disclosure');
 storage.setItem(pendingShopKey,JSON.stringify({id:'unknown',title:'Unknown',targetShopId:'22222222-2222-4222-8222-222222222222',destination:'personal'}));assert.throws(()=>consumePending(p,storage),/IMPORT_TARGET_NOT_FOUND/);assert.ok(storage.getItem(pendingShopKey));
 storage.setItem(pendingShopKey,JSON.stringify({id:'personal-import',title:'Own',price:'75 USD',url:'https://amazon.com/dp/B012345678',image:'https://m.media-amazon.com/photo.jpg',destination:'personal'}));const own=consumePending(n,storage);assert.equal(own.shop.shopMode,'personal');assert.match(own.shop.products[0].image,/media-amazon/);assert.equal(own.shop.products[0].price,'75 USD');
});

test('niche navigation, extension shop sync and new strings retain EN FR AR support',async()=>{
 const builder=await readFile('src/app/shop/shop-builder.tsx','utf8'),bg=await readFile('chrome-extension/background.js','utf8'),popup=await readFile('chrome-extension/popup.js','utf8');
 assert.match(builder,/hidden=\{shop.storeMode==='niche'\}/);assert.match(builder,/<MultiShopSwitcher/);assert.match(bg,/targetShopId/);assert.match(popup,/targetShopId:exactShopTarget\(\)\?\.id/);assert.match(bg,/SELLPOSTLY_SYNC_SHOPS/);assert.match(popup,/category.disabled=selected\?\.storeMode==='niche'/);
 for(const key of ['Active Shop','Niche Collection','Niche Name','Create Niche Shop','Free Primary Stores','Sync My Shops'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
