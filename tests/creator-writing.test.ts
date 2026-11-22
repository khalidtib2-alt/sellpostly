import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {writingInput,writingMessages} from '../src/lib/creator-writing';
import {writeWithGemini,WritingError} from '../src/lib/gemini-writer';
import {POST} from '../src/app/api/ai/write/route';
import {translations} from '../src/app/translations';
const base={action:'prompt',topic:'Small apartment routines',contentType:'article',language:'en'};
const response=(text:string)=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]});
test('writer uses full Google endpoint, quoted key cleaning, and model failover on model unavailability',async()=>{
 const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='  \"AQ.TEST_ONLY\"  ';try{let calls=0;
 const result=await writeWithGemini(writingInput(base),async(url,options)=>{calls++;assert.equal(new URL(String(url)).searchParams.get('key'),'AQ.TEST_ONLY');assert.equal(String(url),`https://generativelanguage.googleapis.com/v1beta/models/${calls===1?'gemini-2.5-flash':'gemini-3.8-flash'}:generateContent?key=AQ.TEST_ONLY`);const body=JSON.parse(String(options!.body));assert.equal(body.contents[0].parts[0].text,base.topic);assert.deepEqual(Object.keys(body).sort(),['contents','systemInstruction']);return calls===1?Response.json({error:{message:'Model not found'}},{status:404}):response('A structured writing prompt');});assert.equal(result.model,'gemini-3.8-flash');assert.equal(result.text,'A structured writing prompt');assert.equal(calls,2);
 }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('edited prompt reaches Gemini unchanged for every content type and language',async()=>{
 const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='AIzaTEST_ONLY';try{for(const language of ['en','fr','ar'] as const)for(const contentType of ['article','social','video','newsletter'] as const){const prompt='My edited prompt\n# Structure';const result=await writeWithGemini(writingInput({...base,action:'write',prompt,language,contentType}),async(_url,options)=>{const body=JSON.parse(String(options!.body));assert.equal(body.contents[0].parts[0].text,prompt);assert.match(body.systemInstruction.parts[0].text,/complete finished content/);assert.ok(body.systemInstruction.parts[0].text.includes(contentType));return response(language==='ar'?'# مقال كامل\n\nمحتوى عربي.':'# Complete content\n\nFinished paragraphs.');});assert.equal(result.source,'gemini');assert.match(result.text,/^#/);}}finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('no key, auth, billing, quota, safety, truncation and offline failures never fabricate content or expose secrets',async()=>{
 const old=process.env.GEMINI_API_KEY;try{delete process.env.GEMINI_API_KEY;await assert.rejects(()=>writeWithGemini(writingInput(base),async()=>{throw Error('Must not fetch');}),(e:any)=>e.code==='NOT_CONFIGURED');process.env.GEMINI_API_KEY='secret-test';
 for(const [status,message,code] of [[401,'private secret-test','AUTH'],[403,'billing secret-test','BILLING'],[429,'quota secret-test','QUOTA']] as const){await assert.rejects(()=>writeWithGemini(writingInput(base),async()=>Response.json({error:{message}},{status})),(e:any)=>e instanceof WritingError&&e.code===code&&!String(e).includes('secret-test'));}
 await assert.rejects(()=>writeWithGemini(writingInput(base),async()=>Response.json({promptFeedback:{blockReason:'SAFETY'}})),(e:any)=>e.code==='BLOCKED');
 await assert.rejects(()=>writeWithGemini(writingInput(base),async()=>Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'incomplete'}]}}]})),(e:any)=>e.code==='INCOMPLETE');
 await assert.rejects(()=>writeWithGemini(writingInput(base),async()=>{throw Error('private network details');}),(e:any)=>e.code==='UNAVAILABLE'&&!String(e).includes('private'));
 }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('writer route rejects cross-site/invalid inputs and reports missing key without local text',async()=>{
 const old=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;
 try{const make=(body:any,origin='https://site.example')=>new Request('https://site.example/api/ai/write',{method:'POST',headers:{origin,'x-real-ip':'creator-test'},body:JSON.stringify(body)});
 assert.equal((await POST(make(base,'https://evil.example'))).status,403);assert.equal((await POST(make({...base,topic:''}))).status,400);
 const result=await POST(make(base));assert.equal(result.status,503);const data=await result.json();assert.equal(data.error,'NOT_CONFIGURED');assert.equal(data.text,undefined);assert.equal(data.source,undefined);
 assert.throws(()=>writingInput({...base,action:'write',prompt:''}));assert.throws(()=>writingInput({...base,contentType:'product'}));
 assert.throws(()=>writingInput({...base,action:'write',prompt:'x'.repeat(6001)}),/INPUT_TOO_LARGE/);
 const input=writingInput({...base,price:'45',image:'private',description:'commerce'});assert.deepEqual(Object.keys(input).sort(),['action','topic','prompt','contentType','language'].sort());
 }finally{if(old!==undefined)process.env.GEMINI_API_KEY=old;}
});
test('simple creator UI has two editable steps and copy/Markdown export with translated statuses',async()=>{
 const source=await readFile('src/app/generation/gemini-writer-panel.tsx','utf8');assert.match(source,/\/api\/ai\/write/);assert.match(source,/new Blob/);assert.match(source,/text\/markdown/);assert.match(source,/navigator.clipboard.writeText/);assert.doesNotMatch(source,/readShopList|localCopy|requestCopy|Verified Product|Saved Product|price|category/);assert.equal((source.match(/<textarea/g)||[]).length,2);
 for(const key of Object.values(writingMessages)){const entry=translations[key];assert.ok(entry.fr,key);assert.match(entry.ar,/[\u0600-\u06ff]/,key);}
 const page=await readFile('src/app/prompt-generator/prompt-form.tsx','utf8');assert.doesNotMatch(page,/<textarea|<input|goals =|targetPreset/);assert.match(page,/GeminiWriterPanel/);
});
