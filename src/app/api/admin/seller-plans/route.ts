import {requireAdmin} from '../../../../lib/admin-auth';
import {body,failure,json} from '../../../../lib/api-utils';
import {sellerAccounts,setSellerPlan} from '../../../../lib/seller-plan-admin';
export const runtime='nodejs';
export async function GET(request:Request){try{requireAdmin(request);return json(await sellerAccounts(new URL(request.url).searchParams.get('q')||''));}catch(e){return failure(e);}}
export async function POST(request:Request){try{requireAdmin(request);return json(await setSellerPlan(await body(request)));}catch(e){return failure(e);}}
