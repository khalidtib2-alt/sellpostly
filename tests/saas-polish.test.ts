import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {translations} from '../src/app/translations';
import {validateShop,encodeShop,decodeShop,type Product} from '../src/app/shop/shop-data';
import {shopDraftKey} from '../src/app/shop/multi-shop-data';
import {newestProducts,featuredProduct,lookProducts} from '../src/lib/storefront-selection';
import {productUrlFallback,marketplaceSource} from '../src/lib/product-url-fallback';
import {saveShopDraft,publishShopDraft} from '../src/lib/shop-publishing';
import {generateProductSeo} from '../src/lib/seo-product-copy';
import {POST as importProduct} from '../src/app/api/import-product/route';
import {localCopy,copyInput} from '../src/lib/generation-data';
import {emailTemplate} from '../src/lib/email';
import {quickReplyUrl} from '../src/lib/whatsapp-replies';
import {lookbookMetadata} from '../src/lib/lookbook-seo';
import {lookbookPath} from '../src/app/shop/lookbook-data';
const product=(id:string,gender:'men'|'women'='women',createdAt?:string):Product=>({id,name:id,price:'49 USD',image:'https://merchant.example/'+id+'.jpg',url:'https://merchant.example/'+id,category:'Fashion',source:'Other',gender,createdAt});
const shop=()=>validateShop({name:'Test boutique',bio:'Independent collection',phone:'',shopMode:'personal',shopTheme:'mint',refundPolicy:'7_day',deliveryTimeframe:'3 days',products:[product('older','women','2026-01-01'),product('latest-man','men','2026-03-01'),product('latest-woman','women','2026-02-01')]});
test('Spanish is complete and natural across every translation key, generated text and receipts',()=>{
 for(const [key,value] of Object.entries(translations)){for(const lang of ['fr','es','ar'] as const)assert.ok(value[lang]?.trim(),key+' '+lang);assert.doesNotMatch(value.es,/Impossibel|Vérifiez|Veuillez|Votre\b|votre\b|connexion|\uFFFD/,key);}
 assert.equal(translations['Check Live Price'].es,'Ver el precio actual');assert.equal(translations['Men'].es,'Hombres');
 const copy=localCopy(copyInput({title:'Mochila',language:'es'}));assert.match(copy.description,/Descubre/);assert.match(copy.prompt,/español/);
 assert.match(emailTemplate({kind:'pro',id:'1',language:'es'}).html,/lang="es" dir="ltr"/);
 assert.match(decodeURIComponent(quickReplyUrl('confirmed','es',{id:'id',details:{buyer:{phone:'+212612345678'}}},'Boutique')!),/pedido está confirmado/);
});
test('hero and look selection choose the newest product within the active category and audience without mutating catalogs',()=>{
 const products=shop().products,original=products.map(p=>p.id);assert.equal(featuredProduct(products)?.id,'latest-man');
 assert.equal(featuredProduct(products.filter(p=>p.gender==='women'))?.id,'latest-woman');assert.deepEqual(lookProducts(products,'women').map(p=>p.id),['latest-woman','older']);assert.deepEqual(lookProducts(products,'men').map(p=>p.id),['latest-man']);
 assert.equal(featuredProduct([]),undefined);assert.equal(newestProducts(Array.from({length:8},(_,i)=>product('p'+i))).length,4);assert.deepEqual(products.map(p=>p.id),original);
});
test('blocked-store fallback decodes honest titles and marketplace sources without inventing prices or images',async()=>{
 for(const [url,source] of [['https://www.temu.com/men-running-shoes-g-601234567890.html','Temu'],['https://www.aliexpress.com/item/1005000123456.html','AliExpress'],['https://www.amazon.com/Sony-Wireless-Headphones/dp/B012345678','Amazon'],['https://brand.example/products/linen-shirt','Shopify'],['https://merchant.example/items/caf%C3%A9-cup','Other']] as const){
  assert.equal(marketplaceSource(url),source);const value=productUrlFallback(url);assert.ok(value?.name);assert.equal(value.source,source);assert.equal(value.price,'');assert.equal(value.image,'');assert.equal(value.description,'');
 }
 assert.equal(productUrlFallback('https://merchant.example/'),null);
 for(const url of ['file:///etc/passwd','http://localhost/products/a','http://127.0.0.1/item/foo','http://10.0.0.1/item/foo','http://[::1]/item/foo','https://user:password@merchant.example/products/foo']){
  const response=await importProduct(new Request('http://localhost/api/import-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}));assert.equal(response.status,400,url);
 }
});
test('draft saving is local, publishing forwards seller auth, and failed publishing preserves the draft',async()=>{
 const values=new Map<string,string>([['sellpostly-pro-key','verified-key'],['sellpostly-free-shop-key','session']]);const storage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 const current=shop();saveShopDraft(current,storage);assert.equal(JSON.parse(values.get(shopDraftKey(current))!).products.length,3);
 let calls=0;const request:typeof fetch=async(url,init)=>{calls++;assert.equal(url,'/api/shops');assert.equal(init?.credentials,'same-origin');const headers=new Headers(init?.headers);assert.equal(headers.get('x-pro-key'),'verified-key');assert.equal(headers.get('x-shop-key'),'session');assert.equal(JSON.parse(String(init?.body)).shopMode,'personal');return Response.json({slug:'main-store'});};
 assert.deepEqual(await publishShopDraft(current,storage,request),{slug:'main-store'});assert.equal(calls,1);
 await assert.rejects(publishShopDraft(current,storage,async()=>Response.json({error:'NO_AUTH'},{status:401})));assert.equal(JSON.parse(values.get(shopDraftKey(current))!).name,current.name);
});
test('vertical SEO output is editable data with localized FAQ, explicit language and fact-only prompts',()=>{
 const t=(key:string)=>(translations as any)[key]?.es||key;const copy=generateProductSeo('Bolso de lino','Color beige; cierre con cremallera','Viajeros',t,'es');
 assert.ok(copy.title.length<=60);assert.ok(copy.meta.length<=155);assert.ok(copy.keywords.includes('bolso'));assert.match(copy.faq,/precio actual/);assert.match(copy.prompt,/español/);assert.match(copy.prompt,/No inventes/);assert.ok(copy.hashtags.split(' ').length<=6);assert.match(copy.caption,/beige/);
 assert.doesNotMatch(generateProductSeo('Bolso','','',t,'es').faq,/free shipping|30 days|waterproof/);
});
test('lookbook aliases, outfit overrides and product timestamps survive published/shared catalog normalization',async()=>{
 const original=shop();original.lookbookImages={women:'data:image/png;base64,AAAA',men:'https://merchant.example/outfit.jpg'};
 const restored=await decodeShop(await encodeShop(original));assert.deepEqual(restored.lookbookImages,original.lookbookImages);assert.equal(restored.products[0].createdAt,'2026-01-01T00:00:00.000Z');
 const meta=lookbookMetadata('brand','affiliate',original,'es');assert.ok(String(meta.alternates.canonical).endsWith('/s/brand/affiliate/look'));assert.equal((meta.openGraph as any).url,meta.alternates.canonical);assert.match(String(meta.title),/Compra el look/);
 assert.equal(lookbookPath('brand','affiliate'),'/s/brand/affiliate/look');assert.equal(lookbookPath('brand','personal'),'/s/brand/look');
 for(const gender of ['women','men']){const photo=await readFile('public/lookbook/'+gender+'-editorial.jpg');assert.equal(photo.subarray(0,3).toString('hex'),'ffd8ff');assert.ok(photo.byteLength>100000);}
});
test('rendered lookbook, filtered hero and affiliate footer keep shopping modes and safeguards separate',()=>{
 const script=`import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import assert from 'node:assert/strict';import {LanguageProvider} from './src/app/language-context.tsx';import Lookbook from './src/app/shop/lookbook.tsx';import Footer from './src/app/shop/buyer-store-footer.tsx';import {StorefrontHero} from './src/app/shop/storefront-templates.tsx';
 const wrap=child=>render(React.createElement(LanguageProvider,null,child));const p=(id,gender)=>({id,name:id,gender,category:'Fashion',price:'49 USD',image:'https://merchant.example/'+id+'.jpg',url:'https://amazon.com/dp/B012345678'});const shop={name:'Demo',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',lookbookImages:{women:'https://merchant.example/outfit.jpg',men:'https://merchant.example/men-outfit.jpg'},products:[p('women-1','women'),p('man-secret','men'),p('women-2','women')]};
 const html=wrap(React.createElement(Lookbook,{shop,slug:'brand'}));assert.ok(html.includes('women-1'));assert.ok(!html.includes('man-secret'));assert.ok(html.includes('lookbook-turntable'));assert.ok(!html.includes('lookbook-pin'));assert.ok(html.includes('nofollow sponsored noopener noreferrer'));assert.ok(html.includes('Check Price on Amazon'));assert.ok(!html.includes('49 USD'));assert.ok(!html.includes('Add to Cart'));
 const footer=wrap(React.createElement(Footer,{allowDisputes:false}));assert.ok(!footer.includes('Dispute Order'));assert.ok(footer.includes('partner merchant'));
 const hero=wrap(React.createElement(StorefrontHero,{shop,products:[shop.products[1]],filtered:true}));assert.ok(hero.includes('man-secret.jpg'));assert.ok(!hero.includes('women-1.jpg'));
 const empty=wrap(React.createElement(StorefrontHero,{shop,products:[],filtered:true}));assert.ok(!empty.includes('women-1.jpg'));
 `;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('language context persists Spanish and restores RTL and LTR through real React updates',()=>{
 const script=`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import {LanguageProvider,useLanguage} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><head></head><body><div id="root"></div></body></html>');globalThis.window=window;globalThis.document=window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;const saved=new Map([['sellpostly-language','es']]);globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};let context;
 function Probe(){context=useLanguage();return React.createElement('p',null,context.t('Product Name'));}const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Probe))));assert.equal(document.body.textContent,'Nombre del producto');assert.equal(document.documentElement.dir,'ltr');await act(async()=>context.setLanguage('ar'));assert.equal(document.documentElement.dir,'rtl');await act(async()=>context.setLanguage('es'));assert.equal(document.documentElement.lang,'es');assert.equal(document.documentElement.dir,'ltr');assert.equal(saved.get('sellpostly-language'),'es');await act(async()=>root.unmount());`;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});

test('prompt tab follows client navigation on an already-mounted homepage and keeps unrelated query parameters',()=>{
 const script=`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import {SearchParamsContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js';import Sync from './src/app/generation/formatter-tab-sync.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div><section id="formatter"></section></body></html>');globalThis.window=window;globalThis.document=window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.location={href:'http://localhost/?tab=prompt&keep=1'};let count=0;const paths=[];globalThis.history={state:null,replaceState:(_s,_t,path)=>{paths.push(path);location.href=new URL(path,'http://localhost').href;}};document.getElementById('formatter').scrollIntoView=()=>{};const root=createRoot(document.getElementById('root')),onPrompt=()=>{count++;};const render=params=>root.render(React.createElement(SearchParamsContext.Provider,{value:new URLSearchParams(params)},React.createElement(Sync,{onPrompt})));
 await act(async()=>render(''));assert.equal(count,0);await act(async()=>render('tab=prompt'));assert.equal(count,1);assert.equal(paths[0],'/?keep=1#formatter');await act(async()=>render('keep=1'));assert.equal(count,1);location.href='http://localhost/?tab=prompt';await act(async()=>render('tab=prompt'));assert.equal(count,2);await act(async()=>root.unmount());`;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});

test('extension Spanish covers every popup message and switches generated template labels between LTR and RTL',async()=>{
 const source=await readFile('chrome-extension/popup.js','utf8');
 const dictionary=JSON.parse(source.slice(source.indexOf('{'),source.indexOf('const languageKey')).trim().replace(/;$/,''));
 for(const [key,value] of Object.entries(dictionary))assert.ok((value as any).es?.trim(),key);
 const document={documentElement:{lang:'',dir:''},querySelectorAll:()=>[]};const context=vm.createContext({document});
 vm.runInContext(source.slice(0,source.indexOf('const feedback ='))+'const feedback={textContent:""};',context);
 vm.runInContext('applyLanguage("es")',context);assert.equal(document.documentElement.lang,'es');assert.equal(document.documentElement.dir,'ltr');assert.equal(vm.runInContext('t("Seller Mode")',context),'Modo vendedor');assert.match(vm.runInContext('t("Reply *ORDER* now to claim yours!")',context),/PEDIDO/);
 vm.runInContext('applyLanguage("ar")',context);assert.equal(document.documentElement.dir,'rtl');vm.runInContext('applyLanguage("es")',context);assert.equal(document.documentElement.dir,'ltr');
 assert.match(source,/savedLanguage === "es"/);assert.match(await readFile('chrome-extension/popup.html','utf8'),/data-language="es"/);
});
