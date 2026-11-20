import {body,failure,json} from '../../../../lib/api-utils';
import {submitPeerOrder} from '../../../../lib/peer-order-service';
export const runtime='nodejs';
export async function POST(request:Request){try{return json(await submitPeerOrder(await body(request)),201);}catch(error){return failure(error);}}
