import 'server-only';
import { db } from './db';
import type { ProIdentity } from './pro-auth';
import type { Query } from './order-service';
const run:Query=async(sql,parameters)=>await (await db()).query(sql,parameters);
export async function ensureActiveSubscription(identity:ProIdentity,query:Query=run){
 if(identity.provider==='crypto')return cryptoSubscriptionActive(identity.ownerKey,query);
 const rows=await query(`INSERT INTO subscriptions(owner_key,provider) VALUES($1,$2)
 ON CONFLICT(owner_key) DO UPDATE SET verified_at=now(),provider=excluded.provider
 RETURNING status,expires_at,plan_override`,[identity.ownerKey,identity.provider]);
 if(rows[0]?.status!=='active')return false;if(!rows[0].expires_at||new Date(rows[0].expires_at).getTime()>Date.now()||rows[0].plan_override!==null&&rows[0].plan_override!==undefined)return true;const linked=await query("SELECT 1 FROM shop_account_links l JOIN subscriptions a ON a.owner_key=l.account_owner WHERE l.pro_owner=$1 AND a.plan_override IS NOT NULL AND a.status='active'",[identity.ownerKey]);return linked.length>0;
}


export async function cryptoSubscriptionActive(owner:string,query:Query=run){const rows=await query("SELECT owner_key FROM subscriptions WHERE owner_key=$1 AND provider='crypto' AND status='active' AND (expires_at IS NULL OR expires_at>now() OR plan_override IS NOT NULL OR EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions a ON a.owner_key=l.account_owner WHERE l.pro_owner=$1 AND a.plan_override IS NOT NULL AND a.status='active'))",[owner]);return rows.length===1;}
