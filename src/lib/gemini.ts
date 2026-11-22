import 'server-only';
export const geminiModels=['gemini-2.5-flash','gemini-3.8-flash','gemini-3.5-flash-lite','gemini-flash-latest'] as const;
export const cleanGeminiKey=()=>process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g,'').trim()||'';
export type GeminiAttempt={model:string;status:number;message:string};
export class GeminiHttpError extends Error{
 constructor(public status:number,message:string,public attempts:GeminiAttempt[]=[]){super(message);this.name='GeminiHttpError';}
}
// Google can echo a query URL/key in diagnostics. Preserve its message otherwise.
export function redactGeminiKey(message:string,key:string){let safe=message;for(const secret of [key,encodeURIComponent(key)])if(secret)safe=safe.split(secret).join('[REDACTED]');return safe.replace(/([?&]key=)[^\s&"'<>]+/gi,'$1[REDACTED]');}
export async function geminiContent(body:{contents:unknown[];systemInstruction:unknown},request:typeof fetch=fetch,timeout=50000){
 const key=cleanGeminiKey();if(!key)throw new GeminiHttpError(503,'GEMINI_API_KEY is not configured.');
 const signal=AbortSignal.timeout(timeout),attempts:GeminiAttempt[]=[];
 // Rebuild the payload explicitly so no model-specific generation flags leak in.
 const payload=JSON.stringify({contents:body.contents,systemInstruction:body.systemInstruction});
 for(let index=0;index<geminiModels.length;index++){
  const model=geminiModels[index];
  let response:Response;try{response=await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},signal,body:payload});}catch(error){throw new GeminiHttpError(error instanceof Error&&/Timeout|Abort/.test(error.name)?504:502,error instanceof Error&&/Timeout|Abort/.test(error.name)?'Google Gemini request timed out.':'Could not connect to Google Gemini.',attempts);}
  const chunks:Uint8Array[]=[];let size=0;const reader=response.body?.getReader();
  try{if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>500000)throw new GeminiHttpError(response.ok?502:response.status,'Google Gemini response exceeded the allowed size.',attempts);chunks.push(part.value);}}finally{await reader?.cancel().catch(()=>{});}
  const raw=Buffer.concat(chunks).toString('utf8');let data:any;try{data=JSON.parse(raw);}catch{if(response.ok)throw new GeminiHttpError(502,'Google Gemini returned an invalid JSON response.',attempts);}
  if(response.ok)return {data,model};
  const message=redactGeminiKey(typeof data?.error?.message==='string'?data.error.message:raw||`Google Gemini returned HTTP ${response.status}.`,key);
  attempts.push({model,status:response.status,message});
  if(index<geminiModels.length-1&&[400,404,429,500,502,503,504].includes(response.status))continue;
  throw new GeminiHttpError(response.status,message,attempts);
 }
 throw new GeminiHttpError(502,'Could not connect to Google Gemini.',attempts);
}
