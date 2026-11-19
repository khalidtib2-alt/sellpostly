import {stockPhotos,trackStockSelection} from '../../../../lib/stock-photo-service';
export const runtime='nodejs';
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get('q')||'';
 if(q.length>300)return Response.json({error:'Query is too long.'},{status:400});
 const result=await stockPhotos(q);
 return Response.json({photos:result.photos,representative:true},{headers:{'Cache-Control':'public, max-age=300'}});
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403});
  const body=await request.text();if(body.length>1000)return Response.json({error:'Invalid selection.'},{status:400});
  const {q,id}=JSON.parse(body);if(typeof q!=='string'||q.length>300||typeof id!=='string'||id.length>100)return Response.json({error:'Invalid selection.'},{status:400});
  return await trackStockSelection(q,id)?Response.json({ok:true}):Response.json({error:'Photo selection unavailable. Try another photo.'},{status:409});
 }catch{return Response.json({error:'Invalid selection.'},{status:400});}
}
