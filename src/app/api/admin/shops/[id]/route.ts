import { requireAdmin } from '../../../../../lib/admin-auth';
import { adminShop,updateShop } from '../../../../../lib/admin-service';
import { body,failure,json } from '../../../../../lib/api-utils';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{requireAdmin(request);return json(await adminShop((await params).id));}catch(error){return failure(error);}}
export async function POST(request:Request,{params}:Context){try{requireAdmin(request);return json(await updateShop((await params).id,await body(request,4096)));}catch(error){return failure(error);}}
export const PATCH=POST;

