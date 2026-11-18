import { body,failure,json } from '../../../lib/api-utils';
import { submitOrder } from '../../../lib/order-service';
export const runtime='nodejs';
export async function POST(request:Request){try{return json(await submitOrder(await body(request)),201);}catch(error){return failure(error);}}

