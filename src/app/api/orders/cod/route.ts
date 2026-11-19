import {body,failure,json} from '../../../../lib/api-utils';
import {submitCodOrder} from '../../../../lib/cod-service';
import {notifyEvent} from '../../../../lib/notifications';
export const runtime='nodejs';
export async function POST(request:Request){try{const result=await submitCodOrder(await body(request));await Promise.all([notifyEvent('cod_buyer',result.id),notifyEvent('cod_seller',result.id)]);return json(result,201);}catch(error){return failure(error);}}
