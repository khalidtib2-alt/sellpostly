import {postShop,shopFailure} from '../../../lib/shop-mutations';
import {deleteNicheShop} from '../../../lib/delete-niche-shop';
import {renameShop} from '../../../lib/shop-slug';
import {publicLink} from '../../../lib/public-url';
import {shopIdentity} from '../../../lib/shop-auth';
import {publishShop,sellerShopSettings} from '../../../lib/db';
import {createNicheShop,listSellerShops,saveNicheShop,ShopError} from '../../../lib/multi-shop-service';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
const failure=shopFailure;
export async function GET(request:Request){try{const identity=await shopIdentity(request);if(!identity)return Response.json({error:'PRO_REQUIRED'},{status:401,headers});const settings=await sellerShopSettings(identity.ownerKey);return Response.json({...settings,shops:await listSellerShops(identity.ownerKey),tier:identity.tier,nicheLimit:identity.tier==='pro'?10:0},{headers});}catch(e){return failure(e);}}
export async function POST(request:Request){return postShop(request);}

export async function DELETE(request:Request){try{const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'INVALID_ORIGIN'},{status:403,headers});const identity=await shopIdentity(request);if(!identity)return Response.json({error:'PRO_REQUIRED'},{status:401,headers});const id=new URL(request.url).searchParams.get('id');return Response.json(await deleteNicheShop(identity.ownerKey,id),{headers});}catch(error){return failure(error);}}
