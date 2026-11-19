import {publicLink} from '../../../lib/public-url';
import { proIdentity } from '../../../lib/pro-auth';
import { publishShop,sellerShopSettings } from '../../../lib/db';
export const runtime='nodejs';
export async function POST(request:Request){
  const identity=await proIdentity(request);
  if(!identity)return Response.json({error:'PRO_REQUIRED'},{status:401});
  if(!process.env.DATABASE_URL)return Response.json({error:'DATABASE_NOT_CONFIGURED'},{status:503});
  if(Number(request.headers.get('content-length')||0)>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413});
  let value:unknown;
  try{const body=await request.text();if(body.length>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413});value=JSON.parse(body);}
  catch{return Response.json({error:'INVALID_CATALOG'},{status:400});}
  try{const slug=await publishShop(identity,value);return Response.json({slug,url:publicLink('/s/'+slug)},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({error:'PUBLISH_FAILED'},{status:400});}
}

export async function GET(request:Request){
 const identity=await proIdentity(request);if(!identity)return Response.json({error:"PRO_REQUIRED"},{status:401,headers:{"Cache-Control":"no-store"}});
 try{return Response.json(await sellerShopSettings(identity.ownerKey),{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"SERVICE_UNAVAILABLE"},{status:503});}
}
