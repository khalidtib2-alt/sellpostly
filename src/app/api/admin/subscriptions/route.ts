import { requireAdmin } from '../../../../lib/admin-auth';
import { subscriptions,updateSubscription } from '../../../../lib/admin-service';
import { body,failure,json } from '../../../../lib/api-utils';
export const runtime='nodejs';
export async function GET(request:Request){try{requireAdmin(request);return json(await subscriptions());}catch(error){return failure(error);}}
export async function POST(request:Request){try{requireAdmin(request);return json(await updateSubscription(await body(request)));}catch(error){return failure(error);}}
export const PATCH=POST;

