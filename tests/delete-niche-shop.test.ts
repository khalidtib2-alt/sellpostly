import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {deleteNicheShop} from '../src/lib/delete-niche-shop';
import {createNicheShop,listSellerShops,saveNicheShop} from '../src/lib/multi-shop-service';
import {publicShop} from '../src/lib/db';
import {publicStorefrontEntries} from '../src/lib/public-storefront';
import {validateShop,shopKey} from '../src/app/shop/shop-data';
import {persistShop,readShopList,shopDraftKey} from '../src/app/shop/multi-shop-data';
import {removeNicheShopDraft} from '../src/app/shop/delete-shop-storage';
import type {Query} from '../src/lib/order-service';
import {translations} from '../src/app/translations';

test('niche deletion removes public catalog and frees a slot, protects primary/foreign shops, and preserves the transaction ledger',async()=>{
 const pg=new PGlite(),query:Query=async(sql,args)=>(await pg.query(sql,args)).rows as any[];
 try{const schema=await readFile('src/db/schema.sql','utf8');await pg.exec(schema);await pg.exec(schema);
 await query("INSERT INTO subscriptions(owner_key,provider) VALUES('seller','master'),('other','master')",[]);
 const primary=(await query("INSERT INTO shops(owner_key,slug,name,catalog) VALUES('seller','primary-shop','Primary',$1::jsonb) RETURNING id,is_primary",[JSON.stringify({shopMode:'personal',products:[{id:'main',name:'Primary product'}]})]))[0];assert.equal(primary.is_primary,true);
 const shops=[];for(let i=0;i<10;i++)shops.push(await createNicheShop('seller',{name:'Niche '+i,shopMode:'affiliate',customSlug:'delete-niche-'+i,nicheName:'Audio'},query));
 const target=validateShop({...shops[0],products:[{id:'deal',name:'Deal',price:'25 USD',url:'https://example.com/deal'}]});await saveNicheShop('seller',target,query);
 const order=(await query("INSERT INTO orders(shop_id,gross_amount,coin,network,details) VALUES($1::uuid,25,'USDC','Polygon',$2::jsonb) RETURNING id",[target.shopId,JSON.stringify({product_name:'Deal'})]))[0];
 await assert.rejects(()=>deleteNicheShop('seller',primary.id,query),/NICHE_SHOP_NOT_FOUND_OR_PRIMARY/);await assert.rejects(()=>deleteNicheShop('other',target.shopId,query),/NICHE_SHOP_NOT_FOUND_OR_PRIMARY/);
 assert.ok(await publicShop(target.customSlug!,query,'affiliate'));await deleteNicheShop('seller',target.shopId,query);
 const row=(await query('SELECT deleted_at,is_primary,published,catalog,affiliate_catalog FROM shops WHERE id=$1::uuid',[target.shopId]))[0];assert.ok(row.deleted_at);assert.equal(row.is_primary,false);assert.equal(row.published,false);assert.deepEqual(row.catalog.products,[]);assert.deepEqual(row.affiliate_catalog.products,[]);
 assert.equal((await listSellerShops('seller',query)).some(s=>s.shopId===target.shopId),false);assert.equal(await publicShop(target.customSlug!,query,'affiliate'),null);assert.ok(!(await publicStorefrontEntries(query)).some(e=>e.url.includes(target.customSlug!)));assert.equal((await query('SELECT id FROM orders WHERE id=$1::uuid',[order.id]))[0].id,order.id);
 await assert.rejects(()=>saveNicheShop('seller',target,query),/SHOP_NOT_FOUND/);await assert.rejects(()=>deleteNicheShop('seller',target.shopId,query),/NICHE_SHOP_NOT_FOUND_OR_PRIMARY/);
 await createNicheShop('seller',{name:'Replacement',shopMode:'affiliate',customSlug:'replacement-niche',nicheName:'Art'},query);assert.equal((await listSellerShops('seller',query)).filter(s=>s.storeMode==='niche').length,10);
 assert.equal((await query('SELECT catalog FROM shops WHERE id=$1::uuid',[primary.id]))[0].catalog.products[0].id,'main');
 }finally{await pg.close();}
});
test('local deletion selects the matching primary, removes its draft and pending imports, and preserves other catalogs',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};
 const primary=validateShop({name:'Main',shopMode:'personal',products:[{id:'main',name:'Keep'}]}),affiliate=validateShop({name:'Deals',shopMode:'affiliate',products:[{id:'deal',name:'Keep deal'}]}),niche=validateShop({shopId:'11111111-1111-4111-8111-111111111111',name:'Niche',shopMode:'personal',storeMode:'niche',nicheName:'Art',products:[{id:'art',name:'Remove'}]});
 persistShop(primary,storage);persistShop(affiliate,storage);persistShop(niche,storage);storage.setItem('sellpostly_pending_studio_item',JSON.stringify({targetShopId:niche.shopId}));const result=removeNicheShopDraft(niche,storage);assert.equal(result.shop.shopMode,'personal');assert.equal(result.shop.products[0].id,'main');assert.equal(readShopList(storage).length,2);assert.equal(storage.getItem(shopDraftKey(niche)),null);assert.equal(storage.getItem('sellpostly_pending_studio_item'),null);assert.equal(JSON.parse(storage.getItem(shopKey)!).products[0].id,'main');assert.throws(()=>removeNicheShopDraft(primary,storage),/PRIMARY_SHOP_PROTECTED/);
 assert.equal(validateShop({...primary,isPrimary:false}).isPrimary,true);assert.equal(validateShop({...niche,isPrimary:true}).isPrimary,false);
});
test('delete API rejects cross-origin and unsigned requests before touching the database; invalid shop IDs are rejected',async()=>{
 const {DELETE}=await import('../src/app/api/shops/route');assert.equal((await DELETE(new Request('https://example.com/api/shops?id=anything',{method:'DELETE',headers:{origin:'https://evil.example'}}))).status,403);assert.equal((await DELETE(new Request('https://example.com/api/shops?id=anything',{method:'DELETE'}))).status,401);await assert.rejects(()=>deleteNicheShop('owner','bad-id',async()=>{throw Error('MUST_NOT_QUERY');}),/INVALID_SHOP_ID/);
});
test('delete dialog and completion messages are translated and mounted only in seller settings',async()=>{
 const source=await readFile('src/app/shop/delete-shop-dialog.tsx','utf8');assert.ok(source.includes("shop.storeMode!=='niche'||shop.isPrimary!==false"));assert.ok(source.includes('showModal()'));assert.ok(source.includes('onDelete()'));for(const m of source.matchAll(/\bt\('([^']+)'\)/g)){const key=m[1] as keyof typeof translations;assert.ok(translations[key]?.fr,key);assert.match(translations[key]?.ar||'',/[\u0600-\u06ff]/,key);}assert.ok(translations['Niche shop deleted.'].fr);assert.match(await readFile('src/app/shop/shop-builder.tsx','utf8'),/workspace==='settings'&&!shared&&loaded&&<DeleteShopDialog/);
});
