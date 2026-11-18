import 'server-only';
import { db } from './db';
import type { ProIdentity } from './pro-auth';
import type { Query } from './order-service';
const run:Query=async(sql,parameters)=>await db().query(sql,parameters);
export async function ensureActiveSubscription(identity:ProIdentity,query:Query=run){
 const rows=await query(`INSERT INTO subscriptions(owner_key,provider) VALUES($1,$2)
 ON CONFLICT(owner_key) DO UPDATE SET verified_at=now(),provider=excluded.provider
 RETURNING status`,[identity.ownerKey,identity.provider]);
 return rows[0]?.status==='active';
}

