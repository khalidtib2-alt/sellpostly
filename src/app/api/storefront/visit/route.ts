import {body,failure} from '../../../../lib/api-utils';
import {recordStorefrontVisit} from '../../../../lib/back-office-service';

export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return new Response(null,{status:403});
  await recordStorefrontVisit(await body(request,256));
  return new Response(null,{status:204});
 }catch(error){return failure(error);}
}
