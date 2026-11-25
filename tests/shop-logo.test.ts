import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {saveShopLogo} from '../src/lib/shop-logo-service';
import {createNicheShop,listSellerShops} from '../src/lib/multi-shop-service';
import {publicShop} from '../src/lib/db';
import {validateShop,type Product,shopKey} from '../src/app/shop/shop-data';
import {mergeLogoDraft} from '../src/app/shop/logo-drafts';
import {shopDraftKey,shopListKey} from '../src/app/shop/multi-shop-data';
import {socialBrandAction} from '../src/app/shop/social-brand-links';
import {translations} from '../src/app/translations';
import {POST as logoRoute} from '../src/app/api/shops/logo/route';
const product=(name:string,id='x'):Product=>({id,name,category:'Fashion',gender:'women',price:'19 USD',image:'https://merchant.example/'+id+'.png',url:'https://merchant.example/deal',source:'Other'});
function client(script:string){const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);}
test('logo editor saves the current URL and renders/removes custom logos, with accessible monogram fallback',()=>{
 client(`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Editor from './src/app/shop/shop-logo-editor.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true});globalThis.localStorage={getItem:()=>null,setItem(){}};let value='https://merchant.example/logo.png',saved='';function Harness(){const [logo,setLogo]=React.useState(value);return React.createElement(Editor,{value:logo,name:'My Brand',onChange:setLogo,onSave:v=>saved=v});}const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Harness))));assert.equal(document.querySelector('.shop-logo img').getAttribute('src'),value);await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save Logo').click());assert.equal(saved,value);await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Remove Logo').click());assert.ok(!document.querySelector('.shop-logo img'));assert.equal(document.querySelector('.shop-logo').textContent,'MY');await act(async()=>root.unmount());`);
});
test('logo creation and surgical updates persist per catalog, reject other owners and keep products/payment data intact',async()=>{
 const pg=new PGlite();const query=async(sql:string,args:any[])=>(await pg.query(sql,args)).rows as any[];
 try{await pg.exec(await readFile('src/db/schema.sql','utf8'));await query("INSERT INTO subscriptions(owner_key,provider) VALUES('owner','master'),('other','master')",[]);
 const created=await createNicheShop('owner',{name:'Wardrobe',customSlug:'wardrobe-store',shopMode:'affiliate',nicheName:'Coats',logo:'https://merchant.example/new-logo.png'},query);assert.equal((await query('SELECT logo FROM shops WHERE id=$1',[created.shopId]))[0].logo,created.logo);
 await saveShopLogo('owner',{shopId:created.shopId,shopMode:'affiliate',logo:'data:image/png;base64,AAAA'},query);assert.equal((await listSellerShops('owner',query))[0].logo,'data:image/png;base64,AAAA');assert.equal((await publicShop('wardrobe-store',query,'affiliate'))?.logo,'data:image/png;base64,AAAA');
 await assert.rejects(saveShopLogo('other',{shopId:created.shopId,shopMode:'affiliate',logo:''},query),/SHOP_NOT_FOUND/);await assert.rejects(saveShopLogo('owner',{shopId:created.shopId,shopMode:'personal',logo:''},query),/SHOP_NOT_FOUND/);await assert.rejects(saveShopLogo('owner',{shopId:created.shopId,shopMode:'affiliate',logo:'javascript:alert(1)'},query),/INVALID_SHOP_LOGO/);
 const personal=validateShop({shopMode:'personal',name:'Own Shop',logo:'https://merchant.example/personal.png',products:[product('Coat')],payments:{COD:{enabled:true}}}),affiliate=validateShop({shopMode:'affiliate',name:'Deals',logo:'https://merchant.example/affiliate.png',products:[product('Bag')]});
 const row=(await query("INSERT INTO shops(owner_key,slug,name,catalog,personal_catalog,affiliate_catalog) VALUES('owner','primary-store','Main',$1,$1,$2) RETURNING id",[JSON.stringify(personal),JSON.stringify(affiliate)]))[0];await saveShopLogo('owner',{shopId:row.id,shopMode:'personal',logo:''},query);
 const saved=(await query('SELECT personal_catalog,affiliate_catalog FROM shops WHERE id=$1',[row.id]))[0];assert.equal(saved.personal_catalog.logo,'');assert.equal(saved.personal_catalog.products[0].id,'x');assert.equal(saved.personal_catalog.payments.COD.enabled,true);assert.equal(saved.affiliate_catalog.logo,affiliate.logo);
 }finally{await pg.close();}
});
test('logo draft merge preserves unsaved products and never changes another store',()=>{
 const shop=validateShop({shopId:'11111111-1111-4111-8111-111111111111',shopMode:'personal',name:'Shop',products:[product('Unsaved Coat')]}),other={...shop,shopMode:'affiliate' as const,logo:'other'};const values=new Map([[shopDraftKey(shop),JSON.stringify(shop)],[shopKey,JSON.stringify(other)],[shopListKey,JSON.stringify([shop,other])]]);assert.equal(mergeLogoDraft(shop,'new',{getItem:k=>values.get(k)||null,setItem:(k,v)=>{values.set(k,v);}}),true);assert.equal(JSON.parse(values.get(shopDraftKey(shop))!).products[0].name,'Unsaved Coat');assert.equal(JSON.parse(values.get(shopKey)!).logo,'other');
});
test('logo endpoint rejects cross-origin and oversized input; all share destinations and branded controls are translated',async()=>{
 assert.equal((await logoRoute(new Request('https://sellpostly.com/api/shops/logo',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}))).status,403);assert.equal((await logoRoute(new Request('https://sellpostly.com/api/shops/logo',{method:'POST',headers:{'content-length':'900000'},body:'{}'}))).status,413);
 for(const platform of ['Facebook','X','Telegram'] as const){const action=socialBrandAction(platform,'https://sellpostly.com/s/test/personal','Title','');assert.ok(decodeURIComponent(action.href).includes('https://sellpostly.com/s/test/personal'));}assert.equal(socialBrandAction('Copy','https://sellpostly.com','Title','').href,'');
 const css=await readFile('src/app/globals.css','utf8');for(const color of ['#25d366','#1877f2','#e60023','#e4405f','#25f4ee','#fe2c55','#26a5e4'])assert.ok(css.includes(color));
 for(const key of ['Shop Logo','Save Logo','Logo Image URL','Share this page'] as const)for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang]);
});
