import 'server-only';
import type {WritingInput,WritingErrorCode} from './creator-writing';
export class WritingError extends Error{constructor(public code:WritingErrorCode,public status=502){super(code);}}
const models=['gemini-2.5-flash','gemini-2.5-flash-lite'] as const;
export async function writeWithGemini(input:WritingInput,request:typeof fetch=fetch){
 const key=process.env.GEMINI_API_KEY?.trim();if(!key)throw new WritingError('NOT_CONFIGURED',503);
 const language={en:'English',fr:'French',ar:'Arabic'}[input.language];
 const system=`You are a professional writer. Write entirely in ${language}. Content type: ${input.contentType}. ${input.action==='prompt'?'Create a structured, reusable writing prompt from the topic: audience, purpose, angle, outline, tone, fact-checking requirements and output format. Return only the prompt, not the finished content.':'Follow the supplied edited writing prompt and return the complete finished content, not an outline or an explanation of your process. Use readable Markdown headings and paragraphs where appropriate.'} Do not invent research, statistics, citations, quotes or personal experience. No commerce fields, product metadata or store templates unless explicitly requested by the topic. Do not include implementation notes.`;
 const signal=AbortSignal.timeout(50000);
 for(let i=0;i<models.length;i++){
  try{
   const response=await request(`https://generativelanguage.googleapis.com/v1beta/models/${models[i]}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal,body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input.action==='prompt'?input.topic:input.prompt}]}],generationConfig:{maxOutputTokens:input.action==='prompt'?2200:10000,temperature:.65,thinkingConfig:{thinkingBudget:0}}})});
   // Retry only model availability, exhausted quota or transient service failures.
   if(i===0&&[404,429,500,502,503,504].includes(response.status)){await response.body?.cancel();continue;}
   let raw='';const reader=response.body?.getReader();if(reader){const chunks:Uint8Array[]=[];let size=0;try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>500000)throw new WritingError('UNAVAILABLE');chunks.push(part.value);}}finally{await reader.cancel().catch(()=>{});}raw=Buffer.concat(chunks).toString('utf8');}
   let data:any;try{data=JSON.parse(raw);}catch{if(response.ok)throw new WritingError('UNAVAILABLE');}
   if(!response.ok){const message=String(data?.error?.message||'');throw new WritingError(/billing|payment/i.test(message)?'BILLING':response.status===429?'QUOTA':[401,403].includes(response.status)?'AUTH':response.status===404?'MODEL_UNAVAILABLE':'UNAVAILABLE',response.status===429?429:502);}
   const candidate=data.candidates?.[0];if(candidate?.finishReason==='MAX_TOKENS')throw new WritingError('INCOMPLETE');
   if(data.promptFeedback?.blockReason||candidate?.finishReason&&candidate.finishReason!=='STOP')throw new WritingError('BLOCKED');
   const text=candidate?.content?.parts?.filter((p:any)=>!p.thought).map((p:any)=>typeof p.text==='string'?p.text:'').join('').trim();
   if(!text)throw new WritingError('BLOCKED');
   if(input.action==='prompt'&&text.length>6000)throw new WritingError('INCOMPLETE');
   if(input.language==='ar'&&!/[\u0600-\u06ff]/.test(text))throw new WritingError('INCOMPLETE');
   return {text,model:models[i],source:'gemini' as const};
  }catch(error){if(error instanceof WritingError)throw error;if(error instanceof Error&&/Abort|Timeout/.test(error.name))throw new WritingError('TIMEOUT',504);throw new WritingError('UNAVAILABLE',502);}
 }
 throw new WritingError('UNAVAILABLE');
}
