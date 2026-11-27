import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {curatedPhotos,imageCategories,openversePhotos,commonsPhotos,searchFreePhotos,clipboardImage} from '../src/app/studio/image-sources-data';
import {translations} from '../src/app/translations';
const ov={id:'photo',title:'Studio bag',url:'https://photos.example/bag.jpg',thumbnail:'https://photos.example/thumb.jpg',foreign_landing_url:'https://photos.example/page',license:'cc0',license_url:'https://creativecommons.org/publicdomain/zero/1.0/',creator:'Artist'};
const commons={query:{pages:{one:{pageid:1,title:'File:Bag.jpg',imageinfo:[{url:'https://upload.wikimedia.org/bag.jpg',thumburl:'https://upload.wikimedia.org/thumb.jpg',mime:'image/jpeg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Bag.jpg',extmetadata:{Artist:{value:'<b>Creator</b>'},LicenseShortName:{value:'CC0'},UsageTerms:{value:'Public domain'}}}]}}}};
test('free sources retain public-domain metadata and reject unsupported or unsafe results',()=>{
 assert.equal(openversePhotos({results:[ov,{...ov,license:'by-nc'},{...ov,url:'javascript:alert(1)'}]}).length,1);
 assert.equal(commonsPhotos(commons)[0].creator,'Creator');
 const bad=structuredClone(commons);bad.query.pages.one.imageinfo[0].mime='image/svg+xml';assert.equal(commonsPhotos(bad).length,0);
 for(const c of imageCategories){assert.ok(curatedPhotos(c).length>0);assert.ok(translations[c].ar);assert.ok(curatedPhotos(c).every(p=>p.image.startsWith('/stock-photos/')));}
});
test('stock search uses no keys, falls back on provider failure and never falls back after cancellation',async()=>{
 const calls:string[]=[];const fetcher=async(url:any,options:any)=>{calls.push(String(url));assert.equal(options.credentials,'omit');return calls.length===1?{ok:false}:{ok:true,json:async()=>commons};};
 const photos=await searchFreePhotos('sneakers',new AbortController().signal,fetcher as typeof fetch);assert.equal(photos[0].provider,'Wikimedia Commons');assert.ok(calls[0].includes('api.openverse.org'));assert.ok(calls[1].includes('origin=*'));assert.ok(!calls.join('').includes('api_key'));
 const aborted=new AbortController();aborted.abort();let count=0;await assert.rejects(searchFreePhotos('bag',aborted.signal,(async()=>{count++;}) as any));assert.equal(count,0);
 const result=await searchFreePhotos('bag',new AbortController().signal,(async()=>({ok:true,json:async()=>({results:[ov]})})) as any);assert.equal(result[0].provider,'Openverse');
});
test('clipboard image detection leaves plain text untouched',()=>{
 const file={type:'image/png',size:100} as File;
 assert.equal(clipboardImage({clipboardData:{items:[{type:'text/plain',getAsFile:()=>null}]} as any}),null);
 assert.equal(clipboardImage({clipboardData:{items:[{type:'image/png',getAsFile:()=>file}]} as any}),file);
});
test('source picker handles global image paste, preset selection and listener cleanup; enlarged preview toggles preserve canvases',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';
 import Sources from './src/app/studio/image-sources.tsx';import Editor from './src/app/tools/image-studio.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true,localStorage:{getItem:()=>null,setItem(){}}});
 const original=document.createElement.bind(document);document.createElement=(tag,...args)=>tag==='canvas'?{width:0,height:0,getContext:()=>({drawImage(){},clearRect(){}}),toDataURL:()=> 'data:image/webp;base64,UklGRg=='}:original(tag,...args);
 globalThis.Image=class{naturalWidth=1600;naturalHeight=1200;set src(v){if(v)setTimeout(()=>this.onload?.(),0);}};
 globalThis.FileReader=class{abort(){}readAsDataURL(){this.result='data:image/png;base64,aA==';this.onload?.();}};
 const picked=[];const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Sources,{onSelect:value=>picked.push(value)}))));
 const plain=new window.Event('paste',{bubbles:true,cancelable:true});plain.clipboardData={items:[{type:'text/plain',getAsFile:()=>null}]};window.dispatchEvent(plain);assert.equal(plain.defaultPrevented,false);
 const paste=new window.Event('paste',{bubbles:true,cancelable:true});paste.clipboardData={items:[{type:'image/png',getAsFile:()=>({size:100,type:'image/png'})}]};await act(async()=>{window.dispatchEvent(paste);await new Promise(r=>setTimeout(r,20));});assert.equal(picked.length,1);assert.equal(paste.defaultPrevented,true);
 await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Curated E-Commerce Studio Presets').click());assert.ok(document.querySelectorAll('img').length>0);await act(async()=>{document.querySelector('article button').click();await new Promise(r=>setTimeout(r,20));});assert.equal(picked.length,2);
 await act(async()=>root.unmount());window.dispatchEvent(paste);assert.equal(picked.length,2);
 document.createElement=original;
 const second=createRoot(document.getElementById('root'));await act(async()=>second.render(React.createElement(LanguageProvider,null,React.createElement(Editor,{unified:true}))));
 const canvas=document.querySelector('canvas');await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Expand / Zoom').click());assert.ok(document.querySelector('.studio-editor-expanded'));assert.ok(document.querySelector('.lg\\\\:col-span-8'));
 await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Crop Original').click());assert.equal(document.querySelector('.studio-preview-panes').getAttribute('data-view'),'crop');assert.equal(document.querySelector('canvas'),canvas);await act(async()=>second.unmount());
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
