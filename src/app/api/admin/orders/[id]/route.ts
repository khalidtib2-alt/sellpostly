import { requireAdmin } from '../../../../../lib/admin-auth';
import { adminOrder,updateOrder } from '../../../../../lib/admin-service';
import { body,failure,json } from '../../../../../lib/api-utils';
import {notifyEvent} from '../../../../../lib/notifications';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{requireAdmin(request);return json(await adminOrder((await params).id));}catch(error){return failure(error);}}
export async function POST(request:Request,{params}:Context){try{requireAdmin(request);const result=await updateOrder((await params).id,await body(request));if(result.status==='held')await Promise.all([notifyEvent('held',result.id),notifyEvent('seller_held',result.id)]);if(result.status==='released')await notifyEvent('released',result.id);return json(result);}catch(error){return failure(error);}}
export const PATCH=POST;

