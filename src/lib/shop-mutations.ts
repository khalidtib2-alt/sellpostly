import 'server-only';
import {resolveSellerPlan} from './resolve-seller-plan';
import {renameShop} from './shop-slug';
import {publicLink} from './public-url';
import {publishShop} from './db';
import {createNicheShop,ShopError} from './multi-shop-service';
const headers={'Cache-Control':'no-store'};
type ShopMutationDependencies={resolve?:typeof resolveSellerPlan;createNiche?:typeof createNicheShop;databaseReady?:boolean};
export function shopFailure(e:unknown){const error=e as {code?:string;message?:string};if(e instanceof ShopError)return Response.json({error:e.message},{status:e.status,headers});const known=error.code==='23505'?'SLUG_UNAVAILABLE':['42P01','42703','42883'].includes(error.code||'')?'DATABASE_SCHEMA_REQUIRED':error.code==='P0001'&&/NICHE_LIMIT_REACHED/.test(error.message||'')?'NICHE_LIMIT_REACHED':error.code==='P0001'&&/PRO_REQUIRED/.test(error.message||'')?'PRO_PLAN_REQUIRED':'SHOP_OPERATION_FAILED';console.error('Shop operation failed',{code:error.code||'SHOP_ERROR',reason:known});return Response.json({error:known},{status:known==='SLUG_UNAVAILABLE'||known==='NICHE_LIMIT_REACHED'?409:known==='PRO_PLAN_REQUIRED'?403:503,headers});}
export async function postShop(request:Request,deps:ShopMutationDependencies={}){try{
 const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'INVALID_ORIGIN'},{status:403,headers});
 const identity=await (deps.resolve||resolveSellerPlan)(request);if(!identity)return Response.json({error:'AUTH_REQUIRED'},{status:401,headers});
 if(Number(request.headers.get('content-length')||0)>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413,headers});
 if(!(deps.databaseReady??!!process.env.DATABASE_URL))return Response.json({error:'DATABASE_NOT_CONFIGURED'},{status:503,headers});
 const body=await request.text();if(body.length>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413,headers});
 let value:any;try{value=JSON.parse(body);}catch{return Response.json({error:'INVALID_CATALOG'},{status:400,headers});}
 if(value?.action==='rename')return Response.json(await renameShop(identity.ownerKey,value),{headers});
 if(value?.action==='createNiche'){if(identity.tier!=='pro')return Response.json({error:'PRO_PLAN_REQUIRED'},{status:403,headers});const shop=await (deps.createNiche||createNicheShop)(identity.ownerKey,value.shop);return Response.json({shop,slug:shop.customSlug},{headers});}
 let slug:string;
 if(identity.tier==='pro')slug=await publishShop(identity,value);
 else {if(value?.storeMode==='niche')return Response.json({error:'PRO_REQUIRED'},{status:403,headers});const {publishFreePrimary}=await import('./free-shop-service');slug=await publishFreePrimary(identity.ownerKey,value);}
 return Response.json({slug,url:publicLink('/s/'+slug),affiliateUrl:publicLink('/s/'+slug+'/affiliate'),personalUrl:publicLink('/s/'+slug+'/personal')},{headers});
 }catch(e){return shopFailure(e);}}
