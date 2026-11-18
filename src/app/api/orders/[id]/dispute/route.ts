import { body,failure,json } from '../../../../../lib/api-utils';
import { buyerAction } from '../../../../../lib/order-service';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;return json(await buyerAction(id,await body(request)));}catch(error){return failure(error);}}

