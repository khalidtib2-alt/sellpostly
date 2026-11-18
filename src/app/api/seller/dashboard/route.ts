import { failure,json } from '../../../../lib/api-utils';
import { dashboard } from '../../../../lib/order-service';
import { proIdentity } from '../../../../lib/pro-auth';
export const runtime='nodejs';
export async function GET(request:Request){try{const identity=await proIdentity(request);if(!identity)return json({error:'PRO_REQUIRED'},401);return json(await dashboard(identity.ownerKey));}catch(error){return failure(error);}}

