import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dailyOutfit,garmentZone,utcLookDay,validLookDay,lookShuffle,outfitZones,zoneLabels} from '../src/lib/daily-look';
import type {Product} from '../src/app/shop/shop-data';
import {translations} from '../src/app/translations';
const product=(id:string,name:string,gender:Product['gender']='women',extra:Partial<Product>={}):Product=>({id,name,gender,category:'Fashion',price:'29 USD',image:'https://merchant.example/'+id+'.jpg',url:'https://merchant.example/deal',source:'Other',...extra});
const catalog=Array.from({length:12},(_,i)=>[product('top-'+i,'Structured coat'),product('bottom-'+i,'Tailored trousers'),product('shoe-'+i,'Minimal sneakers'),product('bag-'+i,'Crossbody bag')]).flat();
test('daily outfit is stable across catalog order and draws diverse pieces from the whole catalog',()=>{
 const chosen=dailyOutfit(catalog,'women','2026-11-25',0,'shop','affiliate');
 assert.equal(chosen.length,4);assert.deepEqual(chosen.map(p=>p.zone),outfitZones);
 assert.deepEqual(chosen,dailyOutfit([...catalog].reverse(),'women','2026-11-25',0,'shop','affiliate'));
 for(const {zone,product:p} of chosen)assert.equal(garmentZone(p),zone);
 const combinations=new Set(Array.from({length:12},(_,shuffle)=>JSON.stringify(dailyOutfit(catalog,'women','2026-11-25',shuffle,'shop').map(p=>p.product.id))));assert.equal(combinations.size,12);
 const days=new Set(Array.from({length:20},(_,i)=>JSON.stringify(dailyOutfit(catalog,'women',utcLookDay(new Date(Date.UTC(2026,10,i+1))),0,'shop').map(p=>p.product.id))));assert.ok(days.size>5);
 assert.notDeepEqual(chosen.map(p=>p.product.id),dailyOutfit(catalog,'women','2026-11-25',1,'shop').map(p=>p.product.id));
});
test('selection keeps catalogs and audiences separate, handles sparse catalogs and excludes unavailable/digital goods',()=>{
 const pool=[product('men','Coat','men'),product('kid','Coat','kids'),product('digital','Coat','women',{isDigital:true}),product('digital-legacy','Coat','women',{category:'Digital Product'}),product('empty','Coat','women',{stock:0}),product('affiliate','Coat','women',{catalogMode:'affiliate'}),product('personal','Coat','women',{catalogMode:'personal'}),product('both','Scarf','unisex')];
 assert.deepEqual(new Set(dailyOutfit(pool,'women','2026-11-25',0,'x','personal').map(x=>x.product.id)),new Set(['personal','both']));
 assert.deepEqual(new Set(dailyOutfit(pool,'women','2026-11-25',0,'x','affiliate').map(x=>x.product.id)),new Set(['affiliate','both']));
 assert.deepEqual(dailyOutfit([],'men','2026-11-25'),[]);const duplicate=dailyOutfit([catalog[0],catalog[0]],'women','2026-11-25');assert.equal(duplicate.length,1);
 for(const [name,zone] of [['Manteau','upper'],['Pantalón','lower'],['حقيبة','accessory'],['أحذية','footwear']] as const)assert.equal(garmentZone(product('x',name)),zone);
});
test('UTC daily seed and shared shuffle inputs are validated',()=>{
 assert.equal(utcLookDay(new Date('2026-11-25T23:30:00-05:00')),'2026-11-26');assert.equal(validLookDay('2026-02-30'),false);assert.equal(validLookDay('2026-11-25'),true);assert.equal(validLookDay('junk'),false);assert.equal(lookShuffle('-1'),0);assert.equal(lookShuffle('2'),2);assert.equal(lookShuffle('Infinity'),0);
});
test('daily look UI selects numberless garments, persists Personal cart, shares seed, exports current outfit and respects reduced motion',()=>{
 const script=`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Lookbook from './src/app/shop/lookbook.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><head></head><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true});const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};window.localStorage=localStorage;window.location=globalThis.location={search:'?gender=women&day=2026-11-25&look=1',href:'https://sellpostly.vercel.app/shop/look?gender=women&day=2026-11-25&look=1'};globalThis.history={state:null,replaceState(){}};window.matchMedia=globalThis.matchMedia=()=>({matches:false});globalThis.requestAnimationFrame=fn=>{fn();return 1;};globalThis.cancelAnimationFrame=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};globalThis.CustomEvent=window.CustomEvent;const opened=[];window.open=(url)=>opened.push(url);
 const p=(id,name)=>({id,name,gender:'women',category:'Fashion',price:'19 USD',image:'https://merchant.example/photo.jpg',url:'https://merchant.example/deal',source:'Other'});const shop={name:'Boutique',bio:'',phone:'',shopMode:'personal',shopTheme:'white',lookbookImages:{women:'https://merchant.example/women.jpg',men:'https://merchant.example/men.jpg'},products:[p('top','Coat'),p('bottom','Tailored trousers'),p('shoe','Sneakers'),p('bag','Crossbody bag'),p('other-top','Jacket')]};const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Lookbook,{shop,snapshot:'test'}))));
 assert.equal(new Set(Array.from(document.querySelectorAll('.lookbook-photo-garment[data-product-id]'),e=>e.dataset.productId)).size,4);assert.equal(document.querySelectorAll('.lookbook-garment-zone').length,0);assert.equal(document.querySelectorAll('.lookbook-pick-number').length,0);for(const dot of document.querySelectorAll('.lookbook-photo-garment[data-product-id]'))assert.ok(!/^[1-4]$/.test(dot.textContent));assert.ok(document.querySelector('time').textContent.includes('2026-11-25'));assert.equal(document.querySelectorAll('.lookbook-add-cart').length,5);
 const first=document.querySelector('.lookbook-photo-garment[data-product-id]');await act(async()=>first.click());assert.equal(first.getAttribute('aria-pressed'),'true');assert.ok(document.querySelector('.lookbook-pick[data-active=true]'));
 await act(async()=>document.querySelector('.lookbook-add-cart').click());assert.ok([...saved.values()].some(v=>v.includes(':1')));assert.ok(document.body.textContent.includes('Added to cart'));
 await act(async()=>document.querySelector('.lookbook-socials button[aria-label="WhatsApp"]').click());assert.match(decodeURIComponent(opened.at(-1)),/day=2026-11-25/);assert.match(decodeURIComponent(opened.at(-1)),/look=1/);
 const old=document.querySelector('.lookbook-products').textContent;await act(async()=>document.querySelector('.lookbook-shuffle').click());assert.notEqual(document.querySelector('.lookbook-products').textContent,old);
 // Canvas fixture verifies the real export path, dimensions and numberless current product labels.
 const labels=[];let size;window.HTMLCanvasElement.prototype.getContext=()=>({save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},clip(){},fillRect(){},fillText:(text)=>labels.push(text),drawImage(){}});window.HTMLCanvasElement.prototype.toBlob=function(cb){size=[this.width,this.height];cb(new Blob(['png'],{type:'image/png'}));};globalThis.Image=class{width=1024;height=1536;set src(value){queueMicrotask(()=>this.onload?.());}};URL.createObjectURL=()=> 'blob:story';URL.revokeObjectURL=()=>{};
 await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='9:16 Social Story Preview').click());assert.deepEqual(size,[1080,1920]);assert.ok(labels.includes('2026-11-25'));for(const h of document.querySelectorAll('.lookbook-curated-thumbs button'))assert.ok(labels.includes(h.getAttribute('aria-label').split(': ').slice(1).join(': ')));assert.ok(!labels.some(s=>/^[1-4]\\. /.test(s)));assert.ok(document.querySelector('a[download]'));
 await act(async()=>root.unmount());`;
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
test('stage animation, numberless export, generated editorial defaults and new labels are complete in all locales',async()=>{
 const stage=await readFile('src/app/shop/lookbook-stage.tsx','utf8'),jsx=await readFile('src/app/shop/lookbook.tsx','utf8'),css=await readFile('src/app/globals.css','utf8');
 for(const token of ['setPointerCapture','releasePointerCapture','onPointerMove','onPointerCancel','lookbookRotationStep'])assert.ok(stage.includes(token));
 for(const token of ['perspective:1000px','rotateY(var(--turntable-angle','lookbook-avatar-facet','prefers-reduced-motion'])assert.ok(css.includes(token));
 assert.ok(!jsx.includes('{i+1}'));assert.ok(!jsx.includes('String(index+1)'));assert.match(jsx,/dailyOutfit\(shop.products/);assert.match(jsx,/useShopCart/);assert.match(jsx,/products.length/);
 for(const gender of ['women','men']){const bytes=await readFile('public/lookbook/'+gender+'-editorial.jpg');assert.equal(bytes.readUInt16BE(0),0xffd8);assert.ok(bytes.length>100000);}
 for(const key of [...Object.values(zoneLabels),'Daily curated look','Rotates daily at midnight UTC','Shuffle New Look','Tap a glowing garment dot or a product card to explore the look.','AI-created editorial styling inspiration. Models do not wear or endorse these products.'] as const)for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang].length>3);
});

