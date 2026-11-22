import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {cropForAspect,clampCrop,outputSize,sharpen,storefrontQrUrl,mimeExtension} from '../src/app/tools/media-utils';
import {promoVideo} from '../src/app/shop/promo-video';
import {validateShop,encodeShop,decodeShop} from '../src/app/shop/shop-data';
import {translations} from '../src/app/translations';

test('crop presets preserve actual pixel aspect, stay in bounds and enforce export limits',()=>{
 for(const [w,h] of [[1800,1200],[800,1600]])for(const ratio of [1,4/3,2/3,9/16,16/9]){const crop=cropForAspect(w,h,ratio);assert.ok(crop.x>=0&&crop.y>=0&&crop.x+crop.w<=1.00001&&crop.y+crop.h<=1.00001);assert.ok(Math.abs((crop.w*w)/(crop.h*h)-ratio)<.00001);}
 assert.deepEqual(cropForAspect(100,200,0),{x:0,y:0,w:1,h:1});assert.deepEqual(clampCrop({x:-1,y:4,w:2,h:.5}),{x:0,y:.5,w:1,h:.5});assert.deepEqual(outputSize(1000,1500),{w:1000,h:1500});assert.deepEqual(outputSize(1080,1920),{w:1080,h:1920});
 for(const [w,h] of [[0,100],[-1,100],[5000,100],[4096,4096],[NaN,100]])assert.throws(()=>outputSize(w,h));
 assert.equal(mimeExtension('image/webp'),'webp');assert.equal(mimeExtension('image/jpeg'),'jpg');assert.equal(mimeExtension('image/png'),'png');
});
test('sharpness is a real local convolution that preserves alpha and border pixels',()=>{
 const data=new Uint8ClampedArray(3*3*4).fill(100);for(let i=3;i<data.length;i+=4)data[i]=177;data[16]=140;
 const original=new Uint8ClampedArray(data),result=sharpen(data,3,3,.5);assert.deepEqual(data,original);assert.ok(result[16]>data[16]);assert.equal(result[19],177);assert.equal(result[0],100);assert.deepEqual(sharpen(data,3,3,0),data);
});
test('QR URLs accept only canonical public Personal or Affiliate storefront links',()=>{
 const base='https://sellpostly.vercel.app';assert.equal(storefrontQrUrl(base+'/s/demo-shop/personal?utm_source=x#top',base),base+'/s/demo-shop/personal');assert.equal(storefrontQrUrl(base+'/s/demo-shop/affiliate/',base),base+'/s/demo-shop/affiliate');
 for(const raw of ['https://evil.example/s/demo-shop/personal',base+'/shop?s=private',base+'/s/demo-shop/admin','javascript:alert(1)','http://sellpostly.vercel.app/s/demo-shop/personal'])assert.equal(storefrontQrUrl(raw,base),'');
});
test('promo videos use trusted embed paths, reject injection and Amazon CDN links, and persist independently of affiliate price safeguards',async()=>{
 const cases=[['https://www.youtube.com/shorts/abcdefghijk?feature=share','https://www.youtube-nocookie.com/embed/abcdefghijk'],['https://youtu.be/abcdefghijk','https://www.youtube-nocookie.com/embed/abcdefghijk'],['https://www.tiktok.com/@seller/video/1234567890123456789','https://www.tiktok.com/player/v1/1234567890123456789'],['https://instagram.com/reel/abcd1234/','https://www.instagram.com/reel/abcd1234/embed/'],['https://vimeo.com/123456789','https://player.vimeo.com/video/123456789'],['https://media.seller.example/demo.mp4?token=abc','https://media.seller.example/demo.mp4?token=abc']];
 for(const [url,embed] of cases){const video=promoVideo(url);assert.equal(video?.embed,embed);assert.ok(promoVideo(video?.url));}
 for(const url of ['javascript:alert(1)','data:video/mp4;base64,x','https://youtube.com.evil.example/watch?v=abcdefghijk','https://m.media-amazon.com/video.mp4','https://images-amazon.com/video.mp4','https://localhost/demo.mp4','https://127.0.0.1/demo.mp4','https://user:secret@host.example/demo.mp4','https://example.com/<iframe>'])assert.equal(promoVideo(url),null);
 for(const mode of ['affiliate','personal'] as const){const shop=validateShop({shopMode:mode,products:[{id:'p',name:'Product',price:'29 USD',url:'https://amazon.com/dp/B012345678',image:'https://m.media-amazon.com/image.jpg',promo_video_url:cases[0][0]}]});const restored=await decodeShop(await encodeShop(shop));assert.equal(restored.products[0].promo_video_url,'https://www.youtube.com/watch?v=abcdefghijk');if(mode==='affiliate')assert.ok(restored.products[0].image.includes('media-amazon.com'));else assert.ok(restored.products[0].image.includes('media-amazon.com'));}
});
test('new media copy is translated and server rendering loads no player before buyer consent',async()=>{
 for(const key of ['Seller Media & Storefront Tools','Image Studio','Video & Social','Crop Preset','Sharpness','Product Promo Video (Optional)','Watch Demo','Capture Cover Frame','Download QR PNG'] as const){assert.ok(translations[key].fr);assert.match(translations[key].ar,/[\u0600-\u06ff]/);}
 const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';import Tools from './src/app/tools/media-tools.tsx';import Modal from './src/app/shop/promo-video-modal.tsx';import {LanguageProvider} from './src/app/language-context.tsx';
 const render=C=>renderToStaticMarkup(React.createElement(LanguageProvider,null,C));const html=render(React.createElement(Tools));assert.ok(html.includes('Seller Media &amp; Storefront Tools'));assert.ok(html.includes('image/webp'));assert.ok(html.includes('Video &amp; Social'));const modal=render(React.createElement(Modal,{url:'https://youtu.be/abcdefghijk',onClose:()=>{}}));assert.ok(modal.includes('Play Video'));assert.ok(!modal.includes('<iframe'));assert.ok(modal.includes('Open Original Video'));
 `],{cwd:process.cwd(),encoding:'utf8',timeout:60000});assert.equal(child.status,0,child.stderr||child.stdout);
 const browserSource=await readFile('src/app/tools/browser-media.ts','utf8');assert.ok(!browserSource.includes('fetch('));assert.ok(browserSource.includes('localStorage.setItem(pendingShopKey'));
});
