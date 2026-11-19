import {proIdentity} from '../../../../lib/pro-auth';
import {body,failure,json} from '../../../../lib/api-utils';
import {db} from '../../../../lib/db';
import {emailAddress} from '../../../../lib/email';
import {locale} from '../../../../lib/locale';
import {ApiError,object,text} from '../../../../lib/order-validation';
export const runtime='nodejs';
export async function GET(request:Request){try{const identity=await proIdentity(request);if(!identity)return json({error:'PRO_REQUIRED'},401);const rows=await db().query('SELECT email,language FROM subscriptions WHERE owner_key=$1',[identity.ownerKey]);return json(rows[0]||{email:'',language:'en'});}catch(error){return failure(error);}}
export async function POST(request:Request){try{const identity=await proIdentity(request);if(!identity)return json({error:'PRO_REQUIRED'},401);const input=object(await body(request,2048)),email=text(input.email,254,false).toLowerCase();if(email&&!emailAddress(email))throw new ApiError('INVALID_INPUT');await db().query('UPDATE subscriptions SET email=$2,language=$3 WHERE owner_key=$1',[identity.ownerKey,email,locale(input.language)]);return json({ok:true});}catch(error){return failure(error);}}

