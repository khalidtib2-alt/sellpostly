import { body,failure,json } from '../../../../lib/api-utils';
import { requestUpgrade,upgradeStatus } from '../../../../lib/pro-upgrade';
export const runtime='nodejs';
export async function POST(request:Request){try{return json(await requestUpgrade(await body(request,4096)),201);}catch(error){return failure(error);}}
export async function GET(request:Request){try{const url=new URL(request.url);return json(await upgradeStatus(url.searchParams.get('tx_id')||'',url.searchParams.get('email')||'',request.headers.get('x-upgrade-token')||''));}catch(error){return failure(error);}}

