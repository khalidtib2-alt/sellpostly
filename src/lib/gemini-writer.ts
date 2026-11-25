import 'server-only';
import {cleanGeminiKey,geminiContent,GeminiHttpError} from './gemini';
import {writingControls,type WritingInput,type WritingErrorCode} from './creator-writing';
export class WritingError extends Error{constructor(public code:WritingErrorCode,public status=502,public providerMessage?:string,public attempts?:{model:string;status:number;message:string}[]){super(providerMessage||code);}}

export async function writeWithGemini(input:WritingInput,request:typeof fetch=fetch){
 const key=cleanGeminiKey();if(!key)throw new WritingError('NOT_CONFIGURED',503);
 const language={en:'English',fr:'French',es:'Spanish',ar:'Arabic'}[input.language];
 const system=`You are a professional writer. Write entirely in ${language}. Content type: ${input.contentType}. ${input.action==='prompt'?'Create a structured, reusable writing prompt from the topic: audience, purpose, angle, outline, tone, fact-checking requirements and output format. Return only the prompt, not the finished content.':'Follow the supplied edited writing prompt and return the complete finished content, not an outline or an explanation of your process. Use readable Markdown headings and paragraphs where appropriate.'} Do not invent research, statistics, citations, quotes or personal experience. No commerce fields, product metadata or store templates unless explicitly requested by the topic. Do not include implementation notes. ${writingControls(input)}`;
 try{
   const {data,model}=await geminiContent({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input.action==='prompt'?input.topic:input.prompt}]}]},request);
   const candidate=data.candidates?.[0];if(candidate?.finishReason==='MAX_TOKENS')throw new WritingError('INCOMPLETE');
   if(data.promptFeedback?.blockReason||candidate?.finishReason&&candidate.finishReason!=='STOP')throw new WritingError('BLOCKED');
   const text=candidate?.content?.parts?.filter((p:any)=>!p.thought).map((p:any)=>typeof p.text==='string'?p.text:'').join('').trim();
   if(!text)throw new WritingError('BLOCKED');
   if(input.action==='prompt'&&text.length>6000)throw new WritingError('INCOMPLETE');
   if(input.language==='ar'&&!/[\u0600-\u06ff]/.test(text))throw new WritingError('INCOMPLETE');
   return {text,model,source:'gemini' as const};
 }catch(error){if(error instanceof WritingError)throw error;if(error instanceof GeminiHttpError){const code=/billing|payment/i.test(error.message)?'BILLING':error.status===429?'QUOTA':[401,403].includes(error.status)?'AUTH':error.status===404?'MODEL_UNAVAILABLE':error.status===504?'TIMEOUT':'UNAVAILABLE';throw new WritingError(code,error.status,error.message,error.attempts);}throw new WritingError('UNAVAILABLE',502);}
}
