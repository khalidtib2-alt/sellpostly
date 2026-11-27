import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backdropColor,comparisonPercent,removeBackground} from '../src/app/tools/background-removal';
import {translations} from '../src/app/translations';
test('backdrops preserve PNG/WebP transparency and safely flatten JPEG',()=>{
 assert.equal(backdropColor('transparent','image/png'),null);
 assert.equal(backdropColor('transparent','image/webp'),null);
 assert.equal(backdropColor('transparent','image/jpeg'),'#FFFFFF');
 for(const color of ['#FFFFFF','#F8FAFC','#0F172A','#aabbcc'])assert.equal(backdropColor(color,'image/png'),color);
 assert.equal(backdropColor('url(javascript:x)','image/png'),null);
});
test('comparison divider clamps pointer positions and handles invalid frame size',()=>{
 assert.equal(comparisonPercent(125,100,100),25);
 assert.equal(comparisonPercent(0,100,100),0);
 assert.equal(comparisonPercent(999,100,100),100);
 assert.equal(comparisonPercent(125,100,0),50);
});
test('cancelled removal never starts any runtime download',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(removeBackground(new Blob(),()=>assert.fail(),c.signal),{name:'AbortError'});
});
test('all new studio controls are localized',()=>{
 for(const key of ['Remove Background','Restore Original','Compare Before / After','Studio Backdrop','Transparent Checkerboard','Pure Studio White','Warm Alabaster','Obsidian','Custom Color'] as const)
  for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang].length>0);
});
test('runtime worker forwards progress, returns PNG and terminates on success or cancellation',async()=>{
 const saved=globalThis.Worker;let last:FakeWorker;
 class FakeWorker {onmessage:((event:{data:unknown})=>void)|null=null;onerror:unknown;terminated=false;constructor(){last=this;}postMessage(){}terminate(){this.terminated=true;}}
 Object.assign(globalThis,{Worker:FakeWorker});
 try{
  const updates:unknown[]=[];const promise=removeBackground(new Blob(),p=>updates.push(p),new AbortController().signal);
  last!.onmessage!({data:{progress:42}});assert.deepEqual(updates,[42]);
  const blob=new Blob(['png'],{type:'image/png'});last!.onmessage!({data:{blob}});assert.equal(await promise,blob);assert.equal(last!.terminated,true);
  const controller=new AbortController(),cancelled=removeBackground(new Blob(),()=>{},controller.signal);controller.abort();await assert.rejects(cancelled,{name:'AbortError'});assert.equal(last!.terminated,true);
 }finally{if(saved)globalThis.Worker=saved;else Reflect.deleteProperty(globalThis,'Worker');}
});
