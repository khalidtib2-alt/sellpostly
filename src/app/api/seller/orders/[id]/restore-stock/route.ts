import {body,failure,json} from '../../../../../../lib/api-utils';
import {object} from '../../../../../../lib/order-validation';
import {shopIdentity} from '../../../../../../lib/shop-auth';
import {restoreSellerOrder} from '../../../../../../lib/inventory-service';

export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'INVALID_ORIGIN'},403);
  const identity=await shopIdentity(request);
  if(!identity)return json({error:'AUTH_REQUIRED'},401);
  const {id}=await params;
  const input=object(await body(request));
  return json(await restoreSellerOrder(identity.ownerKey,id,input.action,input.note));
 }catch(error){return failure(error);}
}
