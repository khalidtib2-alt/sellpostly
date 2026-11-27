import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {instantCutout,instantCutoutSize} from '../src/app/tools/instant-cutout';
import {translations} from '../src/app/translations';
function picture(w:number,h:number,color:number){const p=new Uint8ClampedArray(w*h*4);for(let i=0;i<p.length;i+=4){p[i]=p[i+1]=p[i+2]=color;p[i+3]=255;}return p;}
test('instant cutout removes white, off-white, gray and dark uniform backgrounds without changing the source',()=>{
 for(const background of [255,248,180,30]){
  const p=picture(40,40,background);for(let y=10;y<30;y++)for(let x=10;x<30;x++){const i=(y*40+x)*4;p[i]=230;p[i+1]=30;p[i+2]=50;}
  const copy=new Uint8ClampedArray(p),out=instantCutout(p,40,40,16);
  assert.equal(out[3],0);assert.equal(out[(20*40+20)*4+3],255);assert.deepEqual(p,copy);
 }
});
test('flood fill preserves enclosed white product details and existing transparency',()=>{
 const p=picture(40,40,255);for(let y=8;y<32;y++)for(let x=8;x<32;x++){const i=(y*40+x)*4;p[i]=p[i+1]=p[i+2]=20;}
 for(let y=15;y<25;y++)for(let x=15;x<25;x++){const i=(y*40+x)*4;p[i]=p[i+1]=p[i+2]=255;}
 p[3]=0;const out=instantCutout(p,40,40);assert.equal(out[3],0);assert.equal(out[(20*40+20)*4+3],255);
});
test('tolerance changes gradual background cleanup without crossing product edges',()=>{
 const p=picture(80,40,255);for(let y=0;y<40;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;p[i]=p[i+1]=p[i+2]=255-Math.floor(x/2);}
 const low=instantCutout(p,80,40,10),high=instantCutout(p,80,40,45);
 assert.equal(low[(20*80+70)*4+3],255);assert.equal(high[(20*80+70)*4+3],0);
});
test('cutout resolution is bounded, handles tiny/transparent images and rejects unsafe buffers',()=>{
 assert.deepEqual(instantCutoutSize(4000,2000),{width:1280,height:640});assert.deepEqual(instantCutoutSize(300,600),{width:300,height:600});
 assert.equal(instantCutout(picture(1,1,255),1,1)[3],0);assert.deepEqual(instantCutout(new Uint8ClampedArray(16),2,2),new Uint8ClampedArray(16));
 assert.throws(()=>instantCutout(new Uint8ClampedArray(4),4000,4000));
});
test('instant cutout controls and photo removal are translated in all supported languages',()=>{
 for(const key of ['Instant Cutout (<1s)','AI Cutout (Complex Backgrounds)','Tolerance','Remove Product Photo'] as const)for(const lang of ['fr','es','ar'] as const)assert.ok(translations[key][lang]);
});
test('studio renders separate local and AI actions inside the existing split workspace without loading a model',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';
 import Studio from './src/app/tools/image-studio.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 globalThis.Worker=class{constructor(){throw Error('Runtime must not load on render');}};
 const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Studio,{unified:true})));
 for(const text of ['Instant Cutout','AI Cutout (Complex Backgrounds)','Tolerance','Restore Original','Compare Before / After','lg:sticky','studio-inspector'])assert.ok(html.includes(text),text);
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr||result.stdout);
});
