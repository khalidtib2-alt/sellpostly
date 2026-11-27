import {body,failure,json} from '../../../../lib/api-utils';
import {shopIdentity} from '../../../../lib/shop-auth';
import {object} from '../../../../lib/order-validation';
import {createManualReceipt,readBackOffice,readInvoice,receiptCatalog,saveCustomerProfile} from '../../../../lib/back-office-service';

export const runtime='nodejs';
export async function GET(request:Request){
 try{
  const identity=await shopIdentity(request);
  if(!identity)return json({error:'AUTH_REQUIRED'},401);
  const params=new URL(request.url).searchParams;
  const invoice=params.get('invoice'),catalog=params.get('catalog');
  if(invoice)return json(await readInvoice(identity.ownerKey,invoice));
  if(catalog)return json({products:await receiptCatalog(identity.ownerKey,catalog)});
  const result=await readBackOffice(identity.ownerKey,params);
  if('csv' in result&&typeof result.csv==='string')return new Response(result.csv,{headers:{
   'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="sellpostly-'+result.filename+'"',
  }});
  return json(result);
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'INVALID_ORIGIN'},403);
  const identity=await shopIdentity(request);
  if(!identity)return json({error:'AUTH_REQUIRED'},401);
  const input=object(await body(request));
  if(input.action==='manualReceipt')return json(await createManualReceipt(identity.ownerKey,input),201);
  if(input.action==='customerProfile')return json(await saveCustomerProfile(identity.ownerKey,input));
  return json({error:'INVALID_INPUT'},400);
 }catch(error){return failure(error);}
}
