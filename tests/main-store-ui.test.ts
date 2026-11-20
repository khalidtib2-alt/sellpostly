import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {PUBLISH_SHOP_SQL,publicShop} from '../src/lib/db';
import {createNicheShop,saveNicheShop,listSellerShops} from '../src/lib/multi-shop-service';
import {mainStoreHref} from '../src/app/shop/main-store-link-data';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {translations} from '../src/app/translations';
import type {Query} from '../src/lib/order-service';

test('main-store preference defaults on and survives snapshots without linking general stores',async()=>{
 const niche=validateShop({storeMode:'niche',nicheName:'Shoes',mainStoreSlug:'main-shop',shopMode:'personal',products:[]});
 assert.equal(niche.showMainStoreLink,true);assert.equal(mainStoreHref(niche),'/s/main-shop/personal');
 const off=await decodeShop(await encodeShop({...niche,showMainStoreLink:false}));assert.equal(mainStoreHref(off),null);
 assert.equal(mainStoreHref({...niche,shopMode:'affiliate'}),'/s/main-shop/affiliate');
 assert.equal(mainStoreHref({...niche,storeMode:'general'}),null);assert.equal(mainStoreHref({...niche,mainStoreSlug:undefined}),null);
 assert.equal(mainStoreHref({...niche,mainStoreSlug:'https://wrong.example'}),null);
});

test('public niche links resolve only matching same-owner published primary stores; toggle persists in database',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{
 await pg.exec(await readFile('src/db/schema.sql','utf8'));
 await query("INSERT INTO subscriptions(owner_key,provider) VALUES('seller','master'),('other','master')",[]);
 const personal=validateShop({name:'Main',shopMode:'personal',products:[]}),affiliate=validateShop({name:'Deals',shopMode:'affiliate',products:[]});
 await query(PUBLISH_SHOP_SQL,['seller','seller-main','Main','',JSON.stringify(personal)]);await query(PUBLISH_SHOP_SQL,['seller','unused-slug','Deals','',JSON.stringify(affiliate)]);
 await query(PUBLISH_SHOP_SQL,['other','other-main','Other','',JSON.stringify(personal)]);
 const p=await createNicheShop('seller',{name:'Shoes',shopMode:'personal',customSlug:'shoes-niche',nicheName:'Shoes'},query),a=await createNicheShop('seller',{name:'Deals',shopMode:'affiliate',customSlug:'deals-niche',nicheName:'Kitchen'},query);
 assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),'/s/seller-main/personal');
 assert.equal(mainStoreHref((await publicShop('deals-niche',query,'affiliate'))!),'/s/seller-main/affiliate');
 assert.equal((await listSellerShops('seller',query)).find(s=>s.shopId===p.shopId)?.mainStoreSlug,'seller-main');
 await saveNicheShop('seller',{...p,showMainStoreLink:false,mainStoreSlug:'other-main'},query);
 assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),null);
 await saveNicheShop('seller',{...p,showMainStoreLink:true,mainStoreSlug:'other-main'},query);
 assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),'/s/seller-main/personal');
 await query("UPDATE shops SET suspended=true WHERE slug='seller-main'",[]);assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),null);
 await query("UPDATE shops SET suspended=false,published=false WHERE slug='seller-main'",[]);assert.equal(mainStoreHref((await publicShop('deals-niche',query,'affiliate'))!),null);
 await query("UPDATE shops SET published=true,personal_catalog=NULL WHERE slug='seller-main'",[]);
 assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),null);assert.equal(mainStoreHref((await publicShop('deals-niche',query,'affiliate'))!),'/s/seller-main/affiliate');
 await query("DELETE FROM shops WHERE slug='seller-main'",[]);assert.equal(mainStoreHref((await publicShop('shoes-niche',query,'personal'))!),null);
 assert.ok(a.shopId);
 }finally{await pg.close();}
});

test('global control states cover keyboard, disabled, selected, press and reduced motion; new copy is translated',async()=>{
 const css=await readFile('src/app/globals.css','utf8'),shell=await readFile('src/app/site-shell.tsx','utf8'),cards=await readFile('src/app/shop/storefront-templates.tsx','utf8'),builder=await readFile('src/app/shop/shop-builder.tsx','utf8');
 for(const token of ['cursor:pointer','cursor:not-allowed',':focus-visible','aria-selected','aria-pressed','aria-current','prefers-reduced-motion','scale(.975)','main-store-arrow'])assert.ok(css.includes(token),token);
 assert.match(shell,/usePathname/);assert.match(shell,/aria-current=\{currentLink/);assert.match(cards,/data-state=\{added===p.id\?'saved'/);assert.match(cards,/aria-live="polite"/);
 const start=builder.indexOf('async function saveStoreSettings()'),end=builder.indexOf('async function shareMode',start);assert.doesNotMatch(builder.slice(start,end),/setShareTarget|location\.|scrollIntoView|scrollTo/);
 for(const key of ['Browse All Categories in Our Main Store','Show link to my main store','Save Store Settings','Store settings saved.','Could not save store settings. Try again.'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
