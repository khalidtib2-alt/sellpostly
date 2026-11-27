import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
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
 assert.ok(document.querySelector('h1').textContent.includes('Launch Your Curated Affiliate Storefront'));assert.ok(document.querySelector('#formatter'));assert.ok(document.querySelector('.home-showcase .showcase-formatter'));assert.ok(document.querySelector('.home-showcase .showcase-store'));assert.equal(document.querySelectorAll('.showcase-tabs [role=tab]').length,4);assert.equal(document.querySelectorAll('.showcase-products article').length,3);assert.ok(document.querySelector('.showcase-demo-note').textContent.includes('sample prices'));assert.ok(!document.querySelector('#extension'));assert.ok(!html.includes('Share &amp; Connect'));assert.ok(html.includes('Create My Free Shop'));
 `);
});
test('preview tabs handle keyboard and click interaction and send only to real platform destinations',()=>{
 client(`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Showcase from './src/app/home-showcase.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');globalThis.window=window;globalThis.document=window.document;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.IS_REACT_ACT_ENVIRONMENT=true;const copied=[],opened=[];Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async value=>copied.push(value)}}});window.open=href=>opened.push(href);const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Showcase))));
 const tabs=Array.from(document.querySelectorAll('[role=tab]'));await act(async()=>tabs[1].click());assert.ok(document.querySelector('#preview-panel-hashtags'));await act(async()=>tabs[3].click());assert.ok(document.querySelector('#preview-panel-send'));await act(async()=>Array.from(document.querySelectorAll('.showcase-platforms button')).find(b=>b.textContent.includes('WhatsApp')).click());assert.ok(opened[0].startsWith('https://wa.me/'));assert.ok(copied[0].length>0);assert.ok(!opened.includes('about:blank'));
 const key=new window.Event('keydown',{bubbles:true});key.key='ArrowUp';await act(async()=>tabs[3].dispatchEvent(key));assert.ok(document.querySelector('#preview-panel-preview'));await act(async()=>root.unmount());
 `);
});
test('redirect, responsive shell, motion fallback and new visible copy are localized in all four languages',async()=>{
 assert.match(await readFile('src/app/prompt-generator/page.tsx','utf8'),/redirect\('\/#formatter'\)/);
 const css=await readFile('src/app/globals.css','utf8');for(const token of ['#4f46e5','.saas-header-row','.saas-footer-grid','prefers-reduced-motion'])assert.ok(css.includes(token));
 for(const key of ['No-Code Affiliate Storefronts + Social Post Studio','Create My Free Shop','Prompt & SEO Generator'] as const){for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang]);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
});
