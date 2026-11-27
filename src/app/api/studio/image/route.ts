import {downloadPublicImage} from '../../../../lib/public-image-download';
export const runtime='nodejs';
export async function GET(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'INVALID_ORIGIN'},{status:403});
 try{const url=new URL(request.url).searchParams.get('url');if(!url)return Response.json({error:'IMAGE_URL_REQUIRED'},{status:400});const image=await downloadPublicImage(url,request.signal);return new Response(new Uint8Array(image.bytes),{headers:{'Content-Type':image.type,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'}});}catch{return Response.json({error:'IMAGE_UNAVAILABLE',message:'Upload a local copy if the merchant blocks image access.'},{status:422,headers:{'Cache-Control':'no-store'}});}
}
