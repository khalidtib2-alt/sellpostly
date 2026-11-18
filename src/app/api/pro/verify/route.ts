import { proIdentity } from '../../../../lib/pro-auth';
export const runtime='nodejs';
export async function POST(request:Request){
  const identity=await proIdentity(request);
  return Response.json({valid:!!identity},{status:identity?200:401,headers:{'Cache-Control':'no-store'}});
}
