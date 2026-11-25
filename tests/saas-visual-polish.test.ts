import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {lookShareAction} from '../src/app/shop/lookbook-share';
import {lookbookImage} from '../src/app/shop/lookbook-data';
import {translations} from '../src/app/translations';
function client(script:string){const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);}
test('global shell has only requested primary links, four locales and a three-column legal footer',()=>{
 client(`import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import {PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js';import {Header,Footer} from './src/app/site-shell.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const html=render(React.createElement(LanguageProvider,null,React.createElement(PathnameContext.Provider,{value:'/pricing'},React.createElement(Header)),React.createElement(Footer)));const {document}=parseHTML('<html><body>'+html+'</body></html>');const header=document.querySelector('.saas-header'),footer=document.querySelector('.saas-footer');
 assert.deepEqual(Array.from(header.querySelectorAll('.saas-primary-nav a'),a=>a.getAttribute('href')),['/#formatter','/shop','/pricing']);assert.equal(header.querySelectorAll('.saas-language button').length,4);assert.equal(header.querySelector('.saas-start').getAttribute('href'),'/shop');
 for(const text of ['About','Contact','Creator Studio','Seller Settings','Seller Guides','Prompt Generator','Theme & Color'])assert.ok(!header.textContent.includes(text),text);
 assert.deepEqual(Array.from(footer.querySelectorAll('nav a'),a=>a.getAttribute('href')),['/how-it-works','/about','/contact','/privacy-policy','/terms']);assert.equal(footer.querySelector('.saas-footer-grid').children.length,3);assert.ok(footer.textContent.includes('No-Code Affiliate Storefronts + Social Post Studio'));assert.ok(!footer.textContent.includes('Share & Connect'));
 `);
});
test('homepage keeps the full formatter while the hero has live split previews and no repeated promo banners',()=>{
 client(`import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Home from './src/app/home-content.tsx';import {LanguageProvider} from './src/app/language-context.tsx';const html=render(React.createElement(LanguageProvider,null,React.createElement(Home)));const {document}=parseHTML('<html><body>'+html+'</body></html>');
 assert.ok(document.querySelector('h1').textContent.includes('Launch Your Curated Affiliate Storefront'));assert.ok(document.querySelector('#formatter'));assert.ok(document.querySelector('.home-showcase .showcase-formatter'));assert.ok(document.querySelector('.home-showcase .showcase-store'));assert.equal(document.querySelectorAll('.showcase-tabs [role=tab]').length,4);assert.equal(document.querySelectorAll('.showcase-products article').length,4);assert.ok(document.querySelector('.showcase-demo-note').textContent.includes('sample prices'));assert.ok(!document.querySelector('#extension'));assert.ok(!html.includes('Share &amp; Connect'));assert.ok(html.includes('Create My Free Shop'));
 `);
});
test('preview tabs handle keyboard and click interaction and send only to real platform destinations',()=>{
 client(`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Showcase from './src/app/home-showcase.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');globalThis.window=window;globalThis.document=window.document;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.IS_REACT_ACT_ENVIRONMENT=true;const copied=[],opened=[];Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async value=>copied.push(value)}}});window.open=href=>opened.push(href);const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Showcase))));
 const tabs=Array.from(document.querySelectorAll('[role=tab]'));await act(async()=>tabs[1].click());assert.ok(document.querySelector('#preview-panel-hashtags'));await act(async()=>tabs[3].click());assert.ok(document.querySelector('#preview-panel-send'));await act(async()=>Array.from(document.querySelectorAll('.showcase-platforms button')).find(b=>b.textContent.includes('WhatsApp')).click());assert.ok(opened[0].startsWith('https://wa.me/'));assert.ok(copied[0].length>0);assert.ok(!opened.includes('about:blank'));
 const key=new window.Event('keydown',{bubbles:true});key.key='ArrowUp';await act(async()=>tabs[3].dispatchEvent(key));assert.ok(document.querySelector('#preview-panel-preview'));await act(async()=>root.unmount());
 `);
});
test('lookbook hover and pin selection stay synchronized and gender switching keeps separate products',()=>{
 client(`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Lookbook from './src/app/shop/lookbook.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');globalThis.window=window;globalThis.document=window.document;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.location={href:'http://localhost/shop/look'};globalThis.history={state:null,replaceState:(_s,_t,path)=>{location.href=new URL(path,'http://localhost').href;}};globalThis.matchMedia=()=>({matches:true});window.HTMLElement.prototype.scrollIntoView=()=>{};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const p=(id,gender)=>({id,name:id+' Coat',category:'Fashion',gender,price:'19 USD',image:'https://merchant.example/photo.jpg',url:'https://merchant.example/deal',source:'Other'});const shop={name:'Demo',bio:'',phone:'',shopMode:'affiliate',shopTheme:'white',lookbookImages:{women:'https://merchant.example/women.jpg',men:'https://merchant.example/men.jpg'},products:[p('women-a','women'),p('women-b','women'),p('men-a','men'),p('men-b','men')]};const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Lookbook,{shop,snapshot:'test'}))));
 const card=document.querySelector('.lookbook-pick'),pin=document.querySelector('.lookbook-avatar-garment');await act(async()=>card.dispatchEvent(new window.Event('mouseover',{bubbles:true})));assert.equal(pin.dataset.active,'true');await act(async()=>card.dispatchEvent(new window.Event('mouseout',{bubbles:true})));await act(async()=>pin.click());assert.equal(card.dataset.active,'true');assert.equal(pin.getAttribute('aria-pressed'),'true');assert.equal(document.querySelectorAll('.lookbook-socials button').length,8);assert.ok(document.querySelector('.lookbook-bottom-strip'));
 await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Men').click());assert.ok(document.querySelector('.lookbook-products').textContent.includes('men-a'));assert.ok(!document.querySelector('.lookbook-products').textContent.includes('women-a'));await act(async()=>root.unmount());
 `);
});
test('model defaults are bundled full-length editorial JPEGs with generated-image provenance',async()=>{
 for(const gender of ['women','men'] as const){assert.equal(lookbookImage(gender),'/lookbook/'+gender+'-editorial.jpg');const bytes=await readFile('public'+lookbookImage(gender));assert.equal(bytes.readUInt16BE(0),0xffd8);let dimensions:number[]=[];
  for(let offset=2;offset<bytes.length-9;){const marker=bytes[offset+1];if([0xc0,0xc1,0xc2].includes(marker)){dimensions=[bytes.readUInt16BE(offset+7),bytes.readUInt16BE(offset+5)];break;}const length=bytes.readUInt16BE(offset+2);if(length<2)break;offset+=2+length;}
  assert.ok(dimensions[0]>=1024&&dimensions[1]>=1536);assert.match(await readFile('public/lookbook/PHOTO-CREDITS.md','utf8'),/AI-generated/);
 }
 const jsx=await readFile('src/app/shop/lookbook.tsx','utf8');assert.match(jsx,/custom\[gender\]\|\|shop.lookbookImages/);assert.match(jsx,/lookbook-products-grid/);assert.match(jsx,/LookbookStage/);
});
test('quick share URLs preserve complete links and exclude local photo data and oversized snapshots',()=>{
 const url='https://sellpostly.vercel.app/s/brand/affiliate/look?gender=men';
 assert.equal(lookShareAction('Instagram',url,'Title','').copy,true);assert.equal(lookShareAction('TikTok',url,'Title','').href,'https://www.tiktok.com/');
 const wa=new URL(lookShareAction('WhatsApp',url,'Title','').href);assert.equal(wa.hostname,'wa.me');assert.ok(wa.searchParams.get('text')!.includes(url));
 const pin=new URL(lookShareAction('Pinterest',url,'Title','/lookbook/men.jpg').href);assert.equal(pin.searchParams.get('url'),url);assert.equal(pin.searchParams.get('media'),'https://sellpostly.vercel.app/lookbook/men.jpg');
 assert.equal(new URL(lookShareAction('Pinterest',url,'Title','data:image/png;base64,'+'a'.repeat(10000)).href).searchParams.has('media'),false);
 for(const platform of ['WhatsApp','Pinterest'] as const){const action=lookShareAction(platform,url+'&s='+'x'.repeat(30000),'Title','');assert.equal(action.copy,true);assert.ok(action.href.length<100);assert.ok(!action.href.includes('about:blank'));}
 assert.throws(()=>lookShareAction('WhatsApp','javascript:alert(1)','Title',''));
});
test('redirect, responsive shell, motion fallback and new visible copy are localized in all four languages',async()=>{
 assert.match(await readFile('src/app/prompt-generator/page.tsx','utf8'),/redirect\('\/#formatter'\)/);
 const css=await readFile('src/app/globals.css','utf8');for(const token of ['#4f46e5','.saas-header-row','.saas-footer-grid','.lookbook-products-grid','prefers-reduced-motion','.lookbook-pin[data-active=true]'])assert.ok(css.includes(token));
 for(const key of ['No-Code Affiliate Storefronts + Social Post Studio','Create My Free Shop','Prompt & SEO Generator','9:16 Social Story Preview','Discover an editorial look and the latest curated picks. Products are styling suggestions, not items worn or endorsed by the model.'] as const){for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang]);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
