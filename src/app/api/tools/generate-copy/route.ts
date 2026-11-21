import {copyInput,generateCopy} from '../../../../lib/gemini-generation';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const input=copyInput(await generationBody(request,'copy'));
  const result=await generateCopy(input);
  // Local copy remains usable, including a safe localized provider diagnostic.
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return generationFailure(error);}
}
