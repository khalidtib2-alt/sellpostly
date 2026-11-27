import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {showcaseProducts,showcaseTitleFromUrl,showcaseImage} from '../src/app/home-showcase-data';
import {translations} from '../src/app/translations';
test('showcase uses distinct photographic merchandise and coherent sample offers in every locale',async()=>{
 assert.equal(new Set(showcaseProducts.map(p=>p.discount)).size,4);
 assert.equal(new Set(showcaseProducts.map(p=>p.reviews)).size,4);
 for(const item of showcaseProducts){
  const image=await readFile('public'+item.image);assert.equal(image[0],255);assert.equal(image[1],216);assert.ok(image.length>30000);
  assert.equal(Math.round((1-Number(item.price.slice(1))/Number(item.original.slice(1)))*100),item.discount);
  for(const lang of ['fr','es','ar'] as const)assert.ok(translations[item.title][lang]);
 }
 for(const key of ['Verified curator · Demo','Considered essentials. Better discoveries.','{discount}% OFF','Live preview'] as const)for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang]);
});
test('live URL preview decodes descriptive slugs without accepting script or data URLs',()=>{
 assert.equal(showcaseTitleFromUrl('https://brand.example/products/linen-weekend-bag'),'Linen weekend bag');
 assert.equal(showcaseTitleFromUrl('https://brand.example/products/caf%C3%A9-bag'),'Café bag');
 for(const url of ['javascript:alert(1)','data:text/plain,bag','not a url'])assert.equal(showcaseTitleFromUrl(url),'');
 assert.equal(showcaseImage('javascript:alert(1)'), '');assert.equal(showcaseImage({url:'x'}),'');assert.equal(showcaseImage('https://cdn.example/photo.jpg'),'https://cdn.example/photo.jpg');
});
test('mounted showcase mirrors edits, updates imports, rejects stale responses and localizes the shop',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';
 import Showcase from './src/app/home-showcase.tsx';import {LanguageProvider,useLanguage} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true,localStorage:{getItem:()=>null,setItem(){}}});
 let language;function Probe(){language=useLanguage();return null;}
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Probe),React.createElement(Showcase))));
 const props=node=>node[Object.keys(node).find(k=>k.startsWith('__reactProps'))];
 const first=()=>document.querySelector('[data-showcase-product="0"]');
 assert.equal(document.querySelectorAll('.showcase-products article').length,4);assert.ok(document.querySelector('.showcase-curator').textContent.includes('Demo'));
 const title=document.querySelector('.showcase-output input');await act(async()=>props(title).onChange({target:{value:'My Curated Weekend Bag'}}));assert.equal(first().querySelector('h3').textContent,'My Curated Weekend Bag');
 let calls=0,resolve;globalThis.fetch=()=>{calls++;return new Promise(r=>resolve=r);};const url=document.querySelector('.showcase-url input');
 await act(async()=>props(url).onChange({target:{value:'https://brand.example/products/linen-weekend-bag'}}));assert.equal(first().querySelector('h3').textContent,'Linen weekend bag');assert.equal(calls,0);assert.ok(first().textContent.includes('Check Live Price'));assert.equal(first().querySelector('.showcase-rating'),null);
 await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls,1);
 await act(async()=>resolve({ok:true,json:async()=>({name:'Linen Travel Tote',price:'59',currency:'USD',image:'https://cdn.example/tote.jpg',description:'Lightweight travel companion'})}));
 assert.equal(first().querySelector('h3').textContent,'Linen Travel Tote');assert.equal(first().querySelector('img').getAttribute('src'),'https://cdn.example/tote.jpg');assert.ok(first().textContent.includes('59 USD'));
 await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
 await act(async()=>props(title).onChange({target:{value:'My Latest Edit'}}));await act(async()=>resolve({ok:true,json:async()=>({name:'Stale import',price:'99'})}));assert.equal(first().querySelector('h3').textContent,'My Latest Edit');
 for(const lang of ['fr','es','ar']){await act(async()=>language.setLanguage(lang));assert.equal(document.documentElement.dir,lang==='ar'?'rtl':'ltr');assert.equal(document.querySelectorAll('.showcase-products article').length,4);}
 await act(async()=>root.unmount());
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
