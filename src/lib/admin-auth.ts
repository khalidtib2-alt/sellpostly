import 'server-only';
import { constantEqual } from './pro-auth';
import { ApiError } from './order-validation';
export function requireAdmin(request:Request){
 const expected=process.env.ADMIN_SECRET_KEY;
 const provided=request.headers.get('x-admin-key')||'';
 if(!expected||!provided||provided.length>4096||!constantEqual(expected,provided))throw new ApiError('ADMIN_UNAUTHORIZED',401);
}

