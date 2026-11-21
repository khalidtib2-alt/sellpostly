import {copyInput,generateCopy} from '../../../../lib/gemini-generation';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export async function POST(request:Request){try{return Response.json(await generateCopy(copyInput(await generationBody(request,'copy'))),{headers:{'Cache-Control':'no-store'}});}catch(e){return generationFailure(e);}}
