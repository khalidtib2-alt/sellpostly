import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {studioQuery,studioImage,studioImageProxy} from '../src/lib/studio-image';
import {normalizeStudioImport} from '../src/lib/studio-handoff';
import {downloadPublicImage,publicImageUrl,isPublicImageAddress,imageSignature} from '../src/lib/public-image-download';
import {cropHandles,hitCropHandle,resizeHandle} from '../src/app/tools/crop-corners';
import {instantCutout} from '../src/app/tools/instant-cutout';
test('image-only and aliased handoffs accept data/merchant URLs without a product title',()=>{
 for(const key of ['image','img','src','productImage']){const incoming=studioQuery(new URLSearchParams({[key]:'https://cdn.example/photo.jpg'}));assert.equal(incoming?.image,'https://cdn.example/photo.jpg');assert.equal(normalizeStudioImport(incoming,'Photo').title,'Photo');}
 const data='data:image/png;base64,'+'a'.repeat(1600000);assert.equal(normalizeStudioImport({productImage:data}).image,data);
 assert.equal(studioImage('data:image/png;base64,a b='),'data:image/png;base64,a+b=');
 for(const raw of ['javascript:alert(1)','file:///photo.png','data:image/svg+xml;base64,aA=='])assert.equal(studioImage(raw),'');
 assert.equal(studioImageProxy('data:image/png;base64,aA=='),'');assert.ok(studioImageProxy('https://cdn.example/a.jpg').startsWith('/api/studio/image?'));
});
test('extension keeps full studio data URLs and bridges late mounts without storage access',async()=>{
 let listener:any,bridged:any;const data='data:image/png;base64,'+'a'.repeat(1600000);
 const window:any={postMessage:(value:any)=>{bridged=value.product;}};
 const context=vm.createContext({URL,URLSearchParams,importScripts(){},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},SellPostlyFrontend:{resolve:async()=> 'https://sellpostly.vercel.app'},SellPostlyAffiliate:{isStudio:()=>false},SellPostlyUnbrandedQuery:()=>'',chrome:{runtime:{id:'extension',onMessage:{addListener:(fn:any)=>listener=fn}},tabs:{create:async()=>({id:1})},scripting:{executeScript:async({args,func,world}:any)=>{assert.equal(world,'MAIN');const result=vm.runInNewContext('('+func.toString()+')(...args)',{args,location:{origin:'https://sellpostly.vercel.app',pathname:'/studio'},window,localStorage:{setItem(){throw Error('quota');}},sessionStorage:{setItem(){throw Error('quota');}}});return [{result}];}}}});
 vm.runInContext(await readFile('chrome-extension/background.js','utf8'),context);
 const result:any=await new Promise(resolve=>listener({type:'SELLPOSTLY_OPEN_STUDIO',product:{productImage:data}},{id:'extension'},resolve));assert.equal(result.ok,true);assert.equal(bridged.image,data);assert.equal(window.__SELLPOSTLY_PENDING_STUDIO_IMPORT__.image,data);
});
test('image proxy rejects private addresses, credentials, unsafe protocols and non-raster bytes',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.1.1','::1','::ffff:127.0.0.1','fd00::1'])assert.equal(isPublicImageAddress(ip),false);
 for(const url of ['http://127.0.0.1/a','http://localhost/a','http://[::1]/a','file:///x','https://u:p@cdn.example/a','https://cdn.example:8080/a'])assert.throws(()=>publicImageUrl(url));
 assert.equal(isPublicImageAddress('8.8.8.8'),true);assert.equal(imageSignature(Buffer.from('<svg/>'),'image/png'),false);
});
test('proxy pins the validated IP, returns verified image bytes and blocks private redirect destinations',async()=>{
 const original=https.get;let redirect=false;
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
 (https as any).get=(_url:any,options:any,callback:any)=>{const request=new EventEmitter() as any;request.destroy=(error:any)=>{request.emit('error',error);request.emit('close');};options.lookup('',{},(_error:any,address:string)=>assert.equal(address,'8.8.8.8'));assert.equal(options.autoSelectFamily,false);assert.equal(options.headers.Cookie,undefined);queueMicrotask(()=>{const response=new EventEmitter() as any;response.statusCode=redirect?302:200;response.headers=redirect?{location:'http://127.0.0.1/private'}:{'content-type':'image/png'};response.resume=()=>request.emit('close');callback(response);if(!redirect){response.emit('data',png);response.emit('end');request.emit('close');}});return request;};
 try{assert.deepEqual((await downloadPublicImage('https://8.8.8.8/photo')).bytes,png);redirect=true;await assert.rejects(downloadPublicImage('https://8.8.8.8/photo'),/INVALID_IMAGE_URL/);}finally{https.get=original;}
});
test('all eight crop handles preserve preset ratio, opposite anchors and bounds',()=>{
 const c={x:.2,y:.2,w:.4,h:.4};assert.equal(cropHandles(c).length,8);
 for(const [handle,x,y] of cropHandles(c)){assert.equal(hitCropHandle(c,x,y,.01,.01),handle);for(const delta of [-2,-.1,.1,2]){const next=resizeHandle(c,handle,delta,delta,1);assert.ok(Math.abs(next.w/next.h-1)<.000001);assert.ok(next.x>=-1e-9&&next.y>=-1e-9&&next.x+next.w<=1.000001&&next.y+next.h<=1.000001);}}
 assert.equal(resizeHandle(c,'e',.1,0).x,c.x);assert.equal(resizeHandle(c,'n',0,.1).y+resizeHandle(c,'n',0,.1).h,c.y+c.h);
});
test('conservative cutout preserves light product contours and exact product RGBA',()=>{
 for(const rgb of [[250,250,250],[245,245,245],[250,244,230],[235,237,240]]){
  const input=new Uint8ClampedArray(40*40*4).fill(255);for(let y=10;y<30;y++)for(let x=10;x<30;x++){const i=(y*40+x)*4;input.set([...rgb,211],i);}const original=new Uint8ClampedArray(input),result=instantCutout(input,40,40);
  assert.equal(result[3],0);for(let y=10;y<30;y++)for(let x=10;x<30;x++){const i=(y*40+x)*4;assert.deepEqual(result.slice(i,i+4),original.slice(i,i+4));}assert.deepEqual(input,original);
 }
});
test('URL images load via proxy fallback and the visible crop frame stays synced with sliders and presets',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {parseHTML} from 'linkedom';import assert from 'node:assert/strict';import Editor from './src/app/tools/image-studio.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const {window}=parseHTML('<html><body><div id="root"></div></body></html>');Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true,localStorage:{getItem:()=>null,setItem(){}}});
 const context={drawImage(){},clearRect(){},beginPath(){},rect(){},fill(){},strokeRect(){},fillRect(){},measureText(){return {width:10};}};
 window.HTMLCanvasElement.prototype.getContext=()=>context;window.HTMLCanvasElement.prototype.toBlob=function(cb,mime){cb(new Blob(['image'],{type:mime}));};window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/webp;base64,aA==';window.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:500,height:500});window.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
 const seen=[];globalThis.Image=class{naturalWidth=800;naturalHeight=800;set src(value){seen.push(value);setTimeout(()=>value.startsWith('/api/studio/image?')?this.onload?.():this.onerror?.(),0);}};
 const images=[];const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Editor,{unified:true,initialImage:'https://cdn.example/photo.jpg',onProcessed:image=>images.push(image)}))));await act(async()=>new Promise(r=>setTimeout(r,30)));await act(async()=>new Promise(r=>setTimeout(r,200)));
 assert.ok(seen.some(v=>v.startsWith('/api/studio/image?')));assert.ok(document.body.textContent.includes('Image ready to edit.'));assert.ok(images.some(Boolean));
 await act(async()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Interactive Crop Box').click());
 const canvas=document.querySelector('canvas[aria-label="Crop Preview"]'),props=node=>node[Object.keys(node).find(k=>k.startsWith('__reactProps'))];
 await act(async()=>{props(canvas).onPointerDown({currentTarget:canvas,clientX:500,clientY:250,pointerId:1});props(canvas).onPointerMove({currentTarget:canvas,clientX:400,clientY:250});props(canvas).onPointerUp();});
 const slider=name=>Array.from(document.querySelectorAll('label')).find(l=>l.textContent.startsWith(name)).querySelector('input');assert.equal(Number(slider('Crop Width').value),80);
 await act(async()=>props(slider('Crop X')).onChange({target:{value:'10'}}));assert.equal(Number(slider('Crop X').value),10);
 await act(async()=>props(document.querySelector('.studio-inspector select')).onChange({target:{value:'2'}}));assert.equal(Number(slider('Crop Height').value),75);
 await act(async()=>root.unmount());
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
