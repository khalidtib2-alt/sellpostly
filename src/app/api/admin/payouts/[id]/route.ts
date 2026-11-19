import { requireAdmin } from '../../../../../lib/admin-auth';
import { adminPayout,updatePayout } from '../../../../../lib/admin-service';
import { body,failure,json } from '../../../../../lib/api-utils';
import {notifyEvent} from '../../../../../lib/notifications';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{requireAdmin(request);return json(await adminPayout((await params).id));}catch(error){return failure(error);}}
export async function POST(request:Request,{params}:Context){try{requireAdmin(request);const result=await updatePayout((await params).id,await body(request));if(result.status==='paid')await notifyEvent('payout',result.id);return json(result);}catch(error){return failure(error);}}
export const PATCH=POST;

