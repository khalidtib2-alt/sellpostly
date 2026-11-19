import { requireAdmin } from '../../../../lib/admin-auth';
import { body,failure,json } from '../../../../lib/api-utils';
import { listUpgrades,decideUpgrade } from '../../../../lib/pro-upgrade';
import {notifyEvent} from '../../../../lib/notifications';
export const runtime='nodejs';
export async function GET(request:Request){try{requireAdmin(request);return json(await listUpgrades());}catch(error){return failure(error);}}
export async function POST(request:Request){try{requireAdmin(request);const input=await body(request,4096);const result=await decideUpgrade(input);if(result.status==='approved')await notifyEvent('pro',input.id);return json(result);}catch(error){return failure(error);}}

