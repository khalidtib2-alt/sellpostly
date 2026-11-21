import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST as copyRoute} from '../src/app/api/tools/generate-copy/route';
import {POST as imageRoute} from '../src/app/api/tools/generate-product-image/route';
import {copyInput,localCopy} from '../src/lib/generation-data';
import {geminiEndpoints} from '../src/lib/gemini-endpoints';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
function request(kind:string,id:string,language='en'){
 return new Request('https://sellpostly.example/api/tools/'+kind,{method:'POST',headers:{'Content-Type':'application/json',origin:'https://sellpostly.example','x-real-ip':id},body:JSON.stringify({title:'Black headphones',description:'Rounded ear cups',language})});
}
test('both public routes send the full fixed v1beta URL, trimmed AQ./legacy key header and correct request modalities',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;
 try{for(const key of ['AQ.SYNTHETIC_ENDPOINT_TEST','AIzaSYNTHETIC_ENDPOINT_TEST']){
  process.env.GEMINI_API_KEY=' \n'+key+'\t ';const urls:string[]=[];
  globalThis.fetch=async(url,options)=>{
   const target=String(url),parsed=new URL(target),body=JSON.parse(String(options?.body));urls.push(target);
   assert.equal(parsed.origin,'https://generativelanguage.googleapis.com');assert.equal(parsed.search,'');
   assert.ok(parsed.pathname.startsWith('/v1beta/models/'));assert.equal((options!.headers as Record<string,string>)['x-goog-api-key'],key);assert.equal(options!.method,'POST');assert.ok(!target.includes(key));
   if(url===geminiEndpoints.copy){assert.equal(target,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');assert.equal(body.generationConfig.responseMimeType,'application/json');return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(localCopy(copyInput({title:'Headphones'})))}]}}]});}
   assert.equal(target,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent');assert.deepEqual(body.generationConfig.responseModalities,['TEXT','IMAGE']);assert.equal(body.generationConfig.imageConfig.aspectRatio,'4:3');assert.deepEqual(Object.keys(body.contents[0].parts[0]),['text']);return Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:png}}]}}]});
  };
  const copy=await copyRoute(request('generate-copy','endpoint-copy-'+key));assert.equal(copy.status,200);assert.equal((await copy.json()).source,'gemini');
  const image=await imageRoute(request('generate-product-image','endpoint-image-'+key));assert.equal(image.status,200);assert.equal((await image.json()).available,true);assert.deepEqual(urls,[geminiEndpoints.copy,geminiEndpoints.image]);
 }}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('image quota/billing failures return localized safe diagnostics and prompts while copy generation continues independently',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;process.env.GEMINI_API_KEY='AQ.NEVER_RETURN_THIS_KEY';
 try{for(const language of ['en','fr','ar'] as const){for(const kind of ['QUOTA','BILLING'] as const){let imageCalls=0;
  globalThis.fetch=async(url)=>{if(String(url)===geminiEndpoints.image){imageCalls++;return Response.json({error:{message:(kind==='QUOTA'?'Quota exceeded':'Billing required')+' AQ.NEVER_RETURN_THIS_KEY private provider details'}},{status:kind==='QUOTA'?429:403});}assert.equal(url,geminiEndpoints.copy);return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(localCopy(copyInput({title:'Headphones',language})))}]}}]});};
  const response=await imageRoute(request('generate-product-image','error-'+language+kind,language)),data=await response.json();assert.equal(response.status,200);assert.equal(data.available,false);assert.equal(data.diagnostic.code,kind);assert.equal(data.diagnostic.status,kind==='QUOTA'?429:403);assert.ok(data.diagnostic.message);assert.ok(data.prompt);assert.equal(imageCalls,1);assert.doesNotMatch(JSON.stringify(data),/NEVER_RETURN_THIS_KEY|private provider details/);if(language==='ar'){assert.match(data.diagnostic.message,/[\u0600-\u06ff]/);assert.match(data.prompt,/[\u0600-\u06ff]/);}if(language==='fr')assert.match(data.diagnostic.message,/Google|Quota/);
  const copy=await copyRoute(request('generate-copy','copy-after-'+language+kind,language));assert.equal((await copy.json()).source,'gemini');
 }}}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('copy quota and empty upstream authentication errors keep useful fallback data without leaking Google response text',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;process.env.GEMINI_API_KEY='AQ.SYNTHETIC';
 try{globalThis.fetch=async()=>Response.json({error:{message:'quota private project ID'}},{status:429});const data=await (await copyRoute(request('generate-copy','copy-safe-fallback','ar'))).json();assert.equal(data.source,'local');assert.equal(data.highlights.length,3);assert.equal(data.diagnostic.code,'QUOTA');assert.match(data.diagnostic.message,/[\u0600-\u06ff]/);assert.doesNotMatch(JSON.stringify(data),/private project ID|AQ\.SYNTHETIC/);
  globalThis.fetch=async()=>new Response(null,{status:401});const image=await (await imageRoute(request('generate-product-image','empty-auth'))).json();assert.equal(image.diagnostic.code,'AUTH');assert.equal(image.diagnostic.status,401);assert.ok(image.prompt);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
