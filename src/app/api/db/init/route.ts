import { constantEqual } from '../../../../lib/pro-auth';
import { initializeDatabase } from '../../../../lib/db';
export const runtime='nodejs';
export async function POST(request:Request){
  const secret=process.env.ADMIN_SECRET_KEY;
  const provided=request.headers.get('x-admin-secret')||'';
  if(secret?!constantEqual(secret,provided):process.env.NODE_ENV==='production')return Response.json({error:'UNAUTHORIZED'},{status:401});
  if(!process.env.DATABASE_URL)return Response.json({error:'DATABASE_NOT_CONFIGURED'},{status:503});
  try{await initializeDatabase();return Response.json({ok:true});}
  catch{return Response.json({error:'DATABASE_INIT_FAILED'},{status:500});}
}
