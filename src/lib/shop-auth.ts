import 'server-only';
import {createHash,randomBytes} from 'node:crypto';
import {licensedIdentity} from './pro-auth';
import {db} from './db';
import {sellerPlan} from './seller-plan';
export const freeOwner=(token:string)=>createHash('sha256').update('sellpostly-free:'+token).digest('hex');
export async function shopIdentity(request:Request){
 let pro=await licensedIdentity(request);
 if(pro){const token=request.headers.get('x-shop-key')||'';
 if(/^[0-9a-f]{64}$/.test(token)&&freeOwner(token)!==pro.ownerKey){const owner=freeOwner(token);const rows=await db().query(`INSERT INTO shop_account_links(pro_owner,account_owner) SELECT $1,$2 FROM subscriptions WHERE owner_key=$2 AND provider='free' AND status='active' AND NOT EXISTS(SELECT 1 FROM shops WHERE owner_key=$1) AND NOT EXISTS(SELECT 1 FROM shop_account_links WHERE pro_owner=$1 OR account_owner=$2) ON CONFLICT DO NOTHING RETURNING account_owner`,[pro.ownerKey,owner]);if(rows[0])pro={...pro,ownerKey:owner};}
 return {...pro,tier:process.env.DATABASE_URL?await sellerPlan(pro.ownerKey):'pro' as const};}
 const token=request.headers.get('x-shop-key')||'';if(!/^[0-9a-f]{64}$/.test(token))return null;
 const rows=await db().query("SELECT owner_key FROM subscriptions WHERE owner_key=$1 AND provider='free' AND status='active'",[freeOwner(token)]);
 return rows[0]?{ownerKey:rows[0].owner_key,provider:'free' as const,tier:await sellerPlan(rows[0].owner_key)}:null;
}
export async function createFreeAccount(){const key=randomBytes(32).toString('hex');await db().query("INSERT INTO subscriptions(owner_key,provider) VALUES($1,'free')",[freeOwner(key)]);return key;}
