import {test} from 'node:test';
import assert from 'node:assert/strict';
import {geminiContent,geminiModels,cleanGeminiKey,GeminiHttpError} from '../src/lib/gemini';
import {POST as write} from '../src/app/api/ai/write/route';
import {POST as copy} from '../src/app/api/ai/generate-copy/route';
import {requestCopy,copyInput} from '../src/lib/generation-data';
const body={contents:[{role:'user',parts:[{text:'Write a useful guide.'}]}],systemInstruction:{parts:[{text:'Write clearly.'}]}};
test('shared Gemini transport removes wrapping quotes and sends exactly two fields through all four requested models',async()=>{
 const old=process.env.GEMINI_API_KEY;try{for(const value of ['  "AQ.TEST"  ',"  'AQ.TEST'  ",' AQ.TEST ']){process.env.GEMINI_API_KEY=value;assert.equal(cleanGeminiKey(),'AQ.TEST');}const seen:string[]=[];const result=await geminiContent({...body,generationConfig:{temperature:1,topP:.8,frequencyPenalty:1}} as any,async(url,options)=>{const target=new URL(String(url));assert.equal(target.origin,'https://generativelanguage.googleapis.com');assert.equal(target.searchParams.get('key'),'AQ.TEST');seen.push(target.pathname.split('/').at(-1)!.split(':')[0]);assert.deepEqual(JSON.parse(String(options!.body)),body);return seen.length<4?Response.json({error:{message:'Unavailable model '+seen.at(-1)}},{status:404}):Response.json({candidates:[]});});assert.deepEqual(seen,[...geminiModels]);assert.equal(result.model,'gemini-flash-latest');
 }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('Google status and message survive model errors, including per-model attempts, with key-only redaction',async()=>{
 const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='"AQ.PRIVATE"';try{await assert.rejects(()=>geminiContent(body,async()=>Response.json({error:{message:'Model access denied for this project.'}},{status:403})),(e:any)=>e instanceof GeminiHttpError&&e.status===403&&e.message==='Model access denied for this project.'&&e.attempts.length===1);
 await assert.rejects(()=>geminiContent(body,async()=>Response.json({error:{message:'Unknown model. Visit ?key=AQ.PRIVATE; AQ.PRIVATE'}},{status:404})),(e:any)=>e.status===404&&e.attempts.length===4&&!JSON.stringify(e).includes('AQ.PRIVATE')&&e.message.includes('Unknown model.'));
 }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('writer and seller-copy routes return exact upstream HTTP statuses and messages to their clients',async()=>{
 const old=process.env.GEMINI_API_KEY,original=globalThis.fetch;process.env.GEMINI_API_KEY='  "AIzaMOCK"  ';try{for(const status of [400,401,403,404,429,503]){const message=`Google diagnostic for ${status}: verify access.`;globalThis.fetch=async()=>Response.json({error:{message}},{status});
 for(const [route,data] of [[write,{action:'prompt',topic:'Writing',contentType:'article',language:'fr'}],[copy,{title:'Headphones',language:'fr'}]] as const){const response=await route(new Request('https://example.com/api/ai/test',{method:'POST',headers:{origin:'https://example.com','x-real-ip':'transport-'+status},body:JSON.stringify(data)}));assert.equal(response.status,status);const value=await response.json();assert.equal(value.message,message);assert.ok(value.attempts.length);}
 const client=await requestCopy(copyInput({title:'Headphones'}),async()=>Response.json({error:'UNAVAILABLE',message},{status}));assert.equal(client.diagnostic?.status,status);assert.equal(client.diagnostic?.message,message);
 }}finally{globalThis.fetch=original;if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
