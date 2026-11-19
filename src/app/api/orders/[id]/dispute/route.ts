import { body,failure,json } from '../../../../../lib/api-utils';
import { buyerAction } from '../../../../../lib/order-service';
import {notifyEvent} from '../../../../../lib/notifications';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const input=await body(request,8192);const result=await buyerAction(id,input);if((input.action||'dispute')==='dispute')await notifyEvent('dispute',id);return json(result);}catch(error){return failure(error);}}

