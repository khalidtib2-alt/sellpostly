import 'server-only';
import { db } from './db';
import type { ProIdentity } from './pro-auth';
import type { Query } from './order-service';
const run:Query=async(sql,parameters)=>await db().query(sql,parameters);
export async function ensureActiveSubscription(identity:ProIdentity,query:Query=run){
 if(identity.provider==='crypto')return cryptoSubscriptionActive(identity.ownerKey,query);
 const rows=await query(`INSERT INTO subscriptions(owner_key,provider) VALUES($1,$2)
 ON CONFLICT(owner_key) DO UPDATE SET verified_at=now(),provider=excluded.provider
 RETURNING status,expires_at`,[identity.ownerKey,identity.provider]);
 return rows[0]?.status==='active'&&(!rows[0].expires_at||new Date(rows[0].expires_at).getTime()>Date.now());
}


export async function cryptoSubscriptionActive(owner:string,query:Query=run){const rows=await query("SELECT owner_key FROM subscriptions WHERE owner_key=$1 AND provider='crypto' AND status='active' AND (expires_at IS NULL OR expires_at>now())",[owner]);return rows.length===1;}
