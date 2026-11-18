import { requireAdmin } from '../../../../../lib/admin-auth';
import { adminPayout,updatePayout } from '../../../../../lib/admin-service';
import { body,failure,json } from '../../../../../lib/api-utils';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{requireAdmin(request);return json(await adminPayout((await params).id));}catch(error){return failure(error);}}
export async function POST(request:Request,{params}:Context){try{requireAdmin(request);return json(await updatePayout((await params).id,await body(request)));}catch(error){return failure(error);}}
export const PATCH=POST;

