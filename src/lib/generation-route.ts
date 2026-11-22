import 'server-only';
import {createHash} from 'node:crypto';
const windows=new Map<string,{count:number;until:number}>();
export async function generationBody(request:Request,kind:'copy'|'image'|'writer'){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw Error('INVALID_ORIGIN');if(request.headers.get('sec-fetch-site')==='cross-site')throw Error('INVALID_ORIGIN');
 const now=Date.now();for(const [key,value] of windows)if(value.until<=now)windows.delete(key);const key=kind+createHash('sha256').update(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-real-ip')||'anonymous').digest('hex');const current=windows.get(key)||{count:0,until:now+60000};if(current.count>=(kind==='image'?3:12))throw Error('RATE_LIMITED');if(windows.size>=5000&&!windows.has(key))throw Error('RATE_LIMITED');current.count++;windows.set(key,current);
 const max=kind==='writer'?32768:8192;if(Number(request.headers.get('content-length')||0)>max)throw Error('INPUT_TOO_LARGE');const reader=request.body?.getReader();if(!reader)throw Error('INVALID_INPUT');const chunks:Uint8Array[]=[];let size=0;try{while(true){const v=await reader.read();if(v.done)break;size+=v.value.byteLength;if(size>max)throw Error('INPUT_TOO_LARGE');chunks.push(v.value);}}finally{await reader.cancel().catch(()=>{});}return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function generationFailure(error:unknown){const code=error instanceof Error?error.message:'';return Response.json({error:code==='RATE_LIMITED'?'RATE_LIMITED':code==='INPUT_TOO_LARGE'?'INPUT_TOO_LARGE':'INVALID_INPUT'},{status:code==='RATE_LIMITED'?429:code==='INPUT_TOO_LARGE'?413:code==='INVALID_ORIGIN'?403:400,headers:{'Cache-Control':'no-store'}});}
