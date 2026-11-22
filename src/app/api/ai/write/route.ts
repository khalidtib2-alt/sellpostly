import {writingInput,writingMessages} from '../../../../lib/creator-writing';
import {writeWithGemini,WritingError} from '../../../../lib/gemini-writer';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){try{
 const input=writingInput(await generationBody(request,'writer'));
 return Response.json(await writeWithGemini(input),{headers:{'Cache-Control':'no-store'}});
}catch(error){if(error instanceof WritingError)return Response.json({error:error.code,message:writingMessages[error.code]},{status:error.status,headers:{'Cache-Control':'no-store'}});return generationFailure(error);}}
