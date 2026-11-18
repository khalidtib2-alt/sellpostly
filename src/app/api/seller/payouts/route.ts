import { body,failure,json } from '../../../../lib/api-utils';
import { payout } from '../../../../lib/order-service';
import { proIdentity } from '../../../../lib/pro-auth';
export const runtime='nodejs';
export async function POST(request:Request){try{const identity=await proIdentity(request);if(!identity)return json({error:'PRO_REQUIRED'},401);return json(await payout(identity.ownerKey,await body(request)),201);}catch(error){return failure(error);}}

