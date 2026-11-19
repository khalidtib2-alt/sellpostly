import { body,failure,json } from '../../../../../../lib/api-utils';
import { fulfill } from '../../../../../../lib/order-service';
import { proIdentity } from '../../../../../../lib/pro-auth';
import {notifyEvent} from '../../../../../../lib/notifications';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const identity=await proIdentity(request);if(!identity)return json({error:'PRO_REQUIRED'},401);const {id}=await params;const result=await fulfill(id,identity.ownerKey,await body(request));await notifyEvent('delivered',id);return json(result);}catch(error){return failure(error);}}

