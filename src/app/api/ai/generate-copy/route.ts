import {copyInput,generateCopy} from '../../../../lib/gemini-generation';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const input=copyInput(await generationBody(request,'copy'));
  const result=await generateCopy(input);
  if(result.diagnostic?.status)return Response.json({error:result.diagnostic.code,message:result.diagnostic.message,attempts:result.diagnostic.attempts},{status:result.diagnostic.status,headers:{'Cache-Control':'no-store'}});
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return generationFailure(error);}
}
