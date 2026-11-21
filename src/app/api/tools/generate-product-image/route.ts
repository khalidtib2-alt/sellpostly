import {copyInput,generateProductImage} from '../../../../lib/gemini-generation';
import {generationBody,generationFailure} from '../../../../lib/generation-route';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){try{return Response.json(await generateProductImage(copyInput(await generationBody(request,'image'))),{headers:{'Cache-Control':'no-store'}});}catch(e){return generationFailure(e);}}
