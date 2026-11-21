import {copyInput,generateProductImage} from '../../../../lib/gemini-generation';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 try{
  const input=copyInput(await generationBody(request,'image'));
  const result=await generateProductImage(input);
  // Unavailable images retain the copyable prompt and sanitized quota/billing status.
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return generationFailure(error);}
}
