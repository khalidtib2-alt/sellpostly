import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {clearPhotoBackground,garmentCutout} from '../src/lib/garment-cutout';
import {wearCatalogProduct} from '../src/lib/daily-look';
import {editorialViews,editorialView,editorialImage} from '../src/app/shop/lookbook-data';
import {translations} from '../src/app/translations';
test('edge background removal retains interior white fabric and rejects lifestyle/empty backgrounds',()=>{
 const pixels=new Uint8ClampedArray(10*10*4).fill(255);for(let y=2;y<8;y++)for(let x=2;x<8;x++){const i=(y*10+x)*4;pixels[i]=20;pixels[i+1]=30;pixels[i+2]=50;}
 const center=(5*10+5)*4;pixels[center]=255;pixels[center+1]=255;pixels[center+2]=255;const result=clearPhotoBackground(pixels,10,10)!;assert.equal(result.width,6);assert.equal(result.height,6);assert.equal(result.data[3],0);assert.equal(result.data[center+3],255);assert.equal(pixels[3],255);
 assert.equal(clearPhotoBackground(new Uint8ClampedArray(400).fill(255),10,10),null);const lifestyle=new Uint8ClampedArray(400).fill(70);assert.equal(clearPhotoBackground(lifestyle,10,10),null);
});
test('blocked image processing returns a safe color instead of a raw image overlay',async()=>{
 const result=await garmentCutout('https://merchant.example/photo.png','Black Jacket');assert.equal(result.mode,'color');assert.equal(result.src,'');assert.equal(result.color,'#202126');
});
test('all generated model views are separate JPEG assets and circular angle selection stays correct',async()=>{
 assert.equal(editorialView(359).key,'front');assert.equal(editorialView(-45).key,'right');assert.equal(editorialView(90).key,'side');assert.equal(editorialView(180).key,'back');
 for(const gender of ['men','women'] as const){const paths=editorialViews.map(view=>editorialImage(gender,view.key));assert.equal(new Set(paths).size,5);for(const path of paths){const data=await readFile('public'+path);assert.equal(data.readUInt16BE(0),0xffd8);assert.ok(data.length>60000);}}
});
test('wearing a product replaces exactly its garment slot and rejects unavailable or unsupported goods',()=>{
 const p=(id:string,name:string)=>({id,name,price:'19 USD',category:'Fashion',gender:'women' as const,image:'',url:'',source:'Other'});const first=[{zone:'upper' as const,product:p('a','Coat')},{zone:'lower' as const,product:p('b','Trousers')}];const next=wearCatalogProduct(first,p('c','Black Jacket'));assert.equal(next[0].product.id,'c');assert.equal(next[1].product.id,'b');assert.equal(first[0].product.id,'a');assert.equal(wearCatalogProduct(first,p('coffee','Coffee machine')),first);assert.equal(wearCatalogProduct(first,{...p('sold','Jacket'),stock:0}),first);
});
test('real React controls wear, native drop and touch drop update only matching items and survive share replay',()=>{
 const script=`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Lookbook from './src/app/shop/lookbook.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><head></head><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true});globalThis.localStorage={getItem:()=>null,setItem(){}};window.location=globalThis.location={search:'?day=2026-11-25&gender=women',href:'https://sellpostly.com/shop/look?day=2026-11-25&gender=women'};globalThis.history={state:null,replaceState(){}};window.matchMedia=globalThis.matchMedia=()=>({matches:false});window.HTMLElement.prototype.scrollIntoView=()=>{};const opened=[];window.open=url=>opened.push(url);
 const p=(id,name)=>({id,name,category:'Fashion',gender:'women',price:'19 USD',image:'https://merchant.example/'+id+'.jpg',url:'https://merchant.example/deal',source:'Other'});const shop={name:'Shop',bio:'',phone:'',shopMode:'affiliate',shopTheme:'slate',products:[p('coat','Coat'),p('jacket','Black Jacket'),p('pants','White Cargo Pants'),p('bag','Crossbody Bag'),p('shoe','Sneakers')]};const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Lookbook,{shop,snapshot:'test'}))));
 const card=document.getElementById('look-jacket');assert.equal(card.getAttribute('draggable'),'true');const wear=Array.from(card.querySelectorAll('button')).find(b=>b.textContent==='Wear on Model');await act(async()=>wear.click());assert.equal(document.querySelector('[data-drop-zone="upper"]').dataset.productId,'jacket');assert.equal(card.dataset.active,'true');assert.ok(document.body.textContent.includes('Outfit updated.'));
 const data=new Map();const event=new window.Event('dragstart',{bubbles:true});event.dataTransfer={setData:(k,v)=>data.set(k,v),getData:k=>data.get(k)||''};await act(async()=>card.dispatchEvent(event));assert.equal(document.querySelector('[data-drop-zone="upper"]').dataset.dropActive,'true');const drop=new window.Event('drop',{bubbles:true});drop.dataTransfer=event.dataTransfer;await act(async()=>document.querySelector('[data-drop-zone="upper"]').dispatchEvent(drop));assert.equal(document.querySelector('[data-drop-zone="upper"]').dataset.productId,'jacket');
 const handle=document.getElementById('look-coat').querySelector('.lookbook-drag-handle');handle.setPointerCapture=()=>{};document.elementFromPoint=()=>document.querySelector('[data-drop-zone="upper"]');const touch=type=>{const e=new window.Event(type,{bubbles:true});Object.assign(e,{pointerId:7,pointerType:'touch',clientX:100,clientY:100});handle.dispatchEvent(e);};await act(async()=>touch('pointerdown'));await act(async()=>touch('pointerup'));assert.equal(document.querySelector('[data-drop-zone="upper"]').dataset.productId,'coat');
 await act(async()=>document.querySelector('[aria-label="WhatsApp"]').click());assert.match(decodeURIComponent(opened.at(-1)),/wear=/);assert.ok(!document.querySelector('.lookbook-avatar-facet'));assert.equal(document.querySelectorAll('.lookbook-angle-tabs button').length,5);await act(async()=>root.unmount());`;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('readable preview fonts, unclipped dark logo card, high-contrast category labels and all locale strings remain present',async()=>{
 const css=await readFile('src/app/globals.css','utf8');for(const value of ['.showcase-tabs button{font-size:14px','font-size:16px','.shop-logo-card','.shop-logo-editor legend','.lookbook-garment-cutout','object-fit:contain','.lookbook-photo-garment[data-drop-active=true]'])assert.ok(css.includes(value));
 const jsx=await readFile('src/app/shop/lookbook-mannequin.tsx','utf8');assert.ok(!jsx.includes('ringMesh'));assert.ok(!jsx.includes('lookbook-avatar-facet'));assert.match(jsx,/texture\?\.src/);assert.match(jsx,/view.key!=='back'/);
 for(const key of ['Wear on Model','Drag to dress','Model angle','3/4 Left','3/4 Right','Outfit updated.','Generated model angles and garment overlays are illustrative, not a fit or back-detail guarantee.'] as const)for(const language of ['fr','es','ar'] as const)assert.ok(translations[key][language].length>3);
});
