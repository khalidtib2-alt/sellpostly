import {shopIdentity} from '../../../../lib/shop-auth';
import {db} from '../../../../lib/db';
import {shopFailure} from '../../../../lib/shop-mutations';
import {saveShopLogo} from '../../../../lib/shop-logo-service';
export const runtime='nodejs';
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'INVALID_ORIGIN'},{status:403});
 if(Number(request.headers.get('content-length')||0)>550000)return Response.json({error:'LOGO_TOO_LARGE'},{status:413});
 const identity=await shopIdentity(request);if(!identity)return Response.json({error:'AUTH_REQUIRED'},{status:401});
 const text=await request.text();if(text.length>550000)return Response.json({error:'LOGO_TOO_LARGE'},{status:413});
 let value:unknown;try{value=JSON.parse(text);}catch{return Response.json({error:'INVALID_SHOP_LOGO'},{status:400});}
 return Response.json(await saveShopLogo(identity.ownerKey,value,(sql,args)=>db().query(sql,args)),{headers:{'Cache-Control':'no-store'}});
 }catch(error){return shopFailure(error);}}
