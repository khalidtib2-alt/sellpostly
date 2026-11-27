import {failure,json} from '../../../../lib/api-utils';
import {readInventory} from '../../../../lib/inventory-service';
import {shopIdentity} from '../../../../lib/shop-auth';

export const runtime='nodejs';
export async function GET(request:Request){
 try{
  const identity=await shopIdentity(request);
  if(!identity)return json({error:'AUTH_REQUIRED'},401);
  const data=await readInventory(identity.ownerKey,new URL(request.url).searchParams);
  return 'csv' in data&&typeof data.csv==='string'
   ? new Response(data.csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="sellpostly-inventory.csv"','Cache-Control':'no-store'}})
   : json(data);
 }catch(error){return failure(error);}
}
