import 'server-only';
import { ApiError } from './order-validation';
export async function body(request:Request,max=32000){
 const reader=request.body?.getReader();if(!reader)throw new ApiError('INVALID_INPUT');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new ApiError('INPUT_TOO_LARGE',413);}chunks.push(part.value);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ApiError('INVALID_INPUT');}
}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
export function failure(error:unknown){
 if(error instanceof ApiError)return json({error:error.code},error.status);
 if((error as {code?:string})?.code==='P0001'&&(error as Error).message.includes('Store suspended'))return json({error:'STORE_SUSPENDED'},403);
 if((error as {code?:string})?.code==='P0001'&&(error as Error).message.includes('Buyer confirmation required'))return json({error:'BUYER_CONFIRMATION_REQUIRED'},409);
 if((error as {code?:string})?.code==='23505')return json({error:'TRANSACTION_ALREADY_SUBMITTED'},409);
 if((error as Error)?.message==='DATABASE_NOT_CONFIGURED')return json({error:'SERVICE_UNAVAILABLE'},503);
 return json({error:'REQUEST_FAILED'},500);
}

