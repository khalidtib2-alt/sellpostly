import {createFreeAccount} from '../../../../lib/shop-auth';
export const runtime='nodejs';
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'INVALID_ORIGIN'},{status:403});
 try{return Response.json({key:await createFreeAccount()},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'DATABASE_NOT_CONFIGURED_OR_UNAVAILABLE'},{status:503});}
}
