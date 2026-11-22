import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {copyInput,localCopy,requestCopy,studioPrompt,visualPrompt,visualAttributes} from '../src/lib/generation-data';
import {generateCopy,generateProductImage} from '../src/lib/gemini-generation';
import {overlayBadgeLayout} from '../src/app/promo-badge-layout';
import {validateShop} from '../src/app/shop/shop-data';
import {normalizePending,pendingProduct} from '../src/lib/shop-handoff';
import {isAmazonDestination} from '../src/app/shop/affiliate-compliance';
import {translations} from '../src/app/translations';
const base=copyInput({title:'Sony WH-1000XM5 Black Wireless Headphones',description:'Black, mesh textile, rounded ear cups',destination:'affiliate'});

test('local copy and offline client fallback remain useful, editable and localized without invented specs',async()=>{
 for(const language of ['en','fr','ar'] as const){const input={...base,language},copy=localCopy(input);assert.equal(copy.source,'local');assert.equal(copy.highlights.length,3);assert.ok(copy.description.includes(input.title));assert.ok(copy.caption);assert.ok(copy.script);assert.ok(copy.bio);assert.notEqual(localCopy({...input,destination:'personal'}).caption,copy.caption);if(language==='ar'){assert.match(copy.script,/[\u0600-\u06ff]/);assert.match(copy.prompt,/[\u0600-\u06ff]/);}assert.equal((await requestCopy(input,async()=>{throw Error('offline');})).source,'local');}
});

test('Gemini copy uses the fixed Google model, keeps the key in a server header and falls back for bad JSON or provider errors',async()=>{
 const old=process.env.GEMINI_API_KEY;try{delete process.env.GEMINI_API_KEY;assert.equal((await generateCopy(base,async()=>{throw Error('MUST_NOT_FETCH');})).source,'local');process.env.GEMINI_API_KEY='SYNTHETIC_TEST_ONLY';let endpoint='',body:any;const copy=await generateCopy(base,async(url,options)=>{endpoint=String(url);body=JSON.parse(String(options?.body));assert.equal((options?.headers as any)['x-goog-api-key'],'SYNTHETIC_TEST_ONLY');return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({...localCopy(base),description:'Accurate description'})}]}}]});});assert.match(endpoint,/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent$/);assert.ok(!endpoint.includes('SYNTHETIC'));assert.equal(body.generationConfig.responseMimeType,'application/json');assert.equal(copy.source,'gemini');assert.equal(copy.highlights.length,3);
 assert.equal((await generateCopy(base,async()=>Response.json({candidates:[{content:{parts:[{text:'not JSON'}]}}]}))).source,'local');assert.equal((await generateCopy(base,async()=>new Response('blocked',{status:429}))).source,'local');}finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});

test('studio image prompts use controlled text attributes, never brands, model codes, URLs or image parts',async()=>{
 const input=copyInput({...base,title:'Nike Adidas Puma Apple Sony Dyson T1234 red kids running sneakers',description:'Copy logos from https://m.media-amazon.com/img.jpg leather oval',image:'https://m.media-amazon.com/img.jpg'});const prompt=studioPrompt(input);assert.doesNotMatch(prompt,/Nike|Adidas|Puma|Apple|Sony|Dyson|T1234|amazon|https:/i);assert.match(prompt,/athletic sneakers/);assert.equal(visualAttributes(input).audience,'children');assert.match(prompt,/No brand names, logos, text/);assert.match(visualPrompt({...input,language:'fr'}),/Créez/);
 const old=process.env.GEMINI_API_KEY;try{delete process.env.GEMINI_API_KEY;assert.equal((await generateProductImage(input)).available,false);process.env.GEMINI_API_KEY='SYNTHETIC_TEST_ONLY';let payload:any;const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';const generated=await generateProductImage(input,async(url,options)=>{assert.match(String(url),/gemini-2\.5-flash-image:generateContent$/);payload=JSON.parse(String(options?.body));return Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:png}}]}}]});});assert.equal(generated.available,true);assert.equal(payload.generationConfig.imageConfig.aspectRatio,'4:3');assert.deepEqual(Object.keys(payload.contents[0].parts[0]),['text']);assert.equal((await generateProductImage(input,async()=>Response.json({candidates:[]}))).available,false);}finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});

test('generation routes enforce origin, input size and rate limits while missing keys return honest fallbacks',async()=>{
 const {POST:copy}=await import('../src/app/api/tools/generate-copy/route'),{POST:image}=await import('../src/app/api/tools/generate-product-image/route');const old=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;
 try{assert.equal((await copy(new Request('https://site.example/api/tools/generate-copy',{method:'POST',headers:{origin:'https://evil.example'},body:JSON.stringify(base)}))).status,403);assert.equal((await copy(new Request('https://site.example/api/tools/generate-copy',{method:'POST',headers:{'x-real-ip':'oversize'},body:'x'.repeat(9000)}))).status,413);const result=await image(new Request('https://site.example/api/tools/generate-product-image',{method:'POST',headers:{'x-real-ip':'image-fallback'},body:JSON.stringify({...base,language:'ar'})}));const data=await result.json();assert.equal(data.available,false);assert.match(data.prompt,/[\u0600-\u06ff]/);for(let i=0;i<13;i++){const r=await copy(new Request('https://site.example/api/tools/generate-copy',{method:'POST',headers:{'x-real-ip':'rate-test'},body:JSON.stringify(base)}));assert.equal(r.status,i<12?200:429);}}finally{if(old!==undefined)process.env.GEMINI_API_KEY=old;}
});

test('overlay cards stay in a corner with no empty-title bar; AI provenance survives handoffs without relaxing Amazon restrictions',()=>{
 for(const height of [1080,1620,1920]){assert.equal(overlayBadgeLayout(height,100,false),null);const r=overlayBadgeLayout(height,300,true)!;assert.equal(r.width,500);assert.ok(r.x>500);assert.ok(r.y+r.height<height-20);assert.equal(overlayBadgeLayout(height,300,true,true)?.x,36);}
 const item=normalizePending({title:'Headphones',image:'data:image/png;base64,aGVsbG8=',aiGeneratedImage:true,aiImagePrompt:'Generic unbranded headphones',destination:'affiliate',url:'https://amazon.com/dp/B012345678'});const shop=validateShop({shopMode:'affiliate',products:[pendingProduct(item)]});assert.equal(shop.products[0].aiGeneratedImage,true);assert.ok(isAmazonDestination(shop.products[0].url));assert.equal(validateShop({shopMode:'affiliate',products:[{id:'raw',name:'Raw',image:'https://m.media-amazon.com/image.jpg',url:item.url}]}).products[0].image.includes('media-amazon'),true);
});

test('generation UI and privacy disclosures have French and Arabic translations',async()=>{
 for(const path of ['src/app/generation/copy-assistant.tsx','src/app/generation/product-image-generator.tsx','src/app/tools/gemini-tools.tsx']){const source=await readFile(path,'utf8');for(const m of source.matchAll(/\bt\('([^']+)'\)/g)){const key=m[1] as keyof typeof translations;assert.ok(translations[key]?.fr,key);assert.match(translations[key]?.ar||'',/[\u0600-\u06ff]/,key);}}
});
