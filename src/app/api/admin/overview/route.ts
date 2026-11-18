import { requireAdmin } from '../../../../lib/admin-auth';
import { overview } from '../../../../lib/admin-service';
import { failure,json } from '../../../../lib/api-utils';
export const runtime='nodejs';
export async function GET(request:Request){try{requireAdmin(request);return json(await overview());}catch(error){return failure(error);}}

