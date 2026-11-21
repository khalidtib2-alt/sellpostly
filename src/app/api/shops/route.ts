import {renameShop} from '../../../lib/shop-slug';
import {publicLink} from '../../../lib/public-url';
import {shopIdentity} from '../../../lib/shop-auth';
import {publishShop,sellerShopSettings} from '../../../lib/db';
import {createNicheShop,listSellerShops,saveNicheShop,ShopError} from '../../../lib/multi-shop-service';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
function failure(e:unknown){const error=e as {code?:string;message?:string};if(e instanceof ShopError)return Response.json({error:e.message},{status:e.status,headers});console.error('Shop operation failed',{code:error.code||'SHOP_ERROR'});return Response.json({error:'SHOP_OPERATION_FAILED'},{status:503,headers});}
export async function GET(request:Request){try{const identity=await shopIdentity(request);if(!identity)return Response.json({error:'PRO_REQUIRED'},{status:401,headers});const settings=await sellerShopSettings(identity.ownerKey);return Response.json({...settings,shops:await listSellerShops(identity.ownerKey),tier:identity.tier,nicheLimit:identity.tier==='pro'?10:0},{headers});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const identity=await shopIdentity(request);if(!identity)return Response.json({error:'PRO_REQUIRED'},{status:401,headers});
 if(Number(request.headers.get('content-length')||0)>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413,headers});
 if(!process.env.DATABASE_URL)return Response.json({error:'DATABASE_NOT_CONFIGURED'},{status:503,headers});
 const body=await request.text();if(body.length>2000000)return Response.json({error:'CATALOG_TOO_LARGE'},{status:413,headers});
 let value:any;try{value=JSON.parse(body);}catch{return Response.json({error:'INVALID_CATALOG'},{status:400,headers});}
 if(value?.action==='rename')return Response.json(await renameShop(identity.ownerKey,value),{headers});
 if(value?.action==='createNiche'){if(identity.tier!=='pro')return Response.json({error:'PRO_REQUIRED'},{status:403,headers});const shop=await createNicheShop(identity.ownerKey,value.shop);return Response.json({shop,slug:shop.customSlug},{headers});}
 let slug:string;
 if(identity.tier==='pro')slug=await publishShop(identity,value);
 else {if(value?.storeMode==='niche')return Response.json({error:'PRO_REQUIRED'},{status:403,headers});const {publishFreePrimary}=await import('../../../lib/free-shop-service');slug=await publishFreePrimary(identity.ownerKey,value);}
 return Response.json({slug,url:publicLink('/s/'+slug),affiliateUrl:publicLink('/s/'+slug+'/affiliate'),personalUrl:publicLink('/s/'+slug+'/personal')},{headers});
 }catch(e){return failure(e);}}
