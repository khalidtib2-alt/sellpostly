export const contentTypes=['article','social','video','newsletter'] as const;
export type WritingInput={action:'prompt'|'write';topic:string;prompt:string;contentType:typeof contentTypes[number];language:'en'|'fr'|'ar'};
export function writingInput(raw:unknown):WritingInput{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_INPUT');
 const v=raw as Record<string,unknown>,text=(key:string,max:number)=>{const value=typeof v[key]==='string'?(v[key] as string).trim():'';if(value.length>max)throw Error('INPUT_TOO_LARGE');return value;};
 if(v.action!=='prompt'&&v.action!=='write')throw Error('INVALID_INPUT');
 if(!contentTypes.includes(v.contentType as any)||!['en','fr','ar'].includes(String(v.language)))throw Error('INVALID_INPUT');
 const topic=text('topic',300),prompt=text('prompt',6000);
 if(v.action==='prompt'&&!topic||v.action==='write'&&!prompt)throw Error('INVALID_INPUT');
 return {action:v.action,topic,prompt,contentType:v.contentType as WritingInput['contentType'],language:v.language as WritingInput['language']};
}
export const writingMessages={
 NOT_CONFIGURED:'Gemini is not configured. Ask the site administrator to set GEMINI_API_KEY.',
 AUTH:'Google rejected the API key. Check the server key and its permissions.',
 QUOTA:'Gemini quota reached. Check your Google AI quota and try again later.',
 BILLING:'Google requires billing for this request. Check your Google AI project billing.',
 MODEL_UNAVAILABLE:'The requested Gemini models are unavailable for this project. Check model access.',
 TIMEOUT:'Gemini timed out. Please try again.',
 UNAVAILABLE:'Gemini is unavailable. Please try again later.',
 BLOCKED:'Gemini could not complete this request. Revise the topic or prompt and try again.',
 INCOMPLETE:'Gemini returned incomplete content. Please try again or use a shorter prompt.',
 INVALID_INPUT:'Enter a topic or a writing prompt before generating.',
 RATE_LIMITED:'Too many writing requests. Please wait a minute and try again.',
 INPUT_TOO_LARGE:'The writing prompt is too long. Please shorten it and try again.',
} as const;
export type WritingErrorCode=keyof typeof writingMessages;
