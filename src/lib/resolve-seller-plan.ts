import 'server-only';
import {createHash} from 'node:crypto';
import {db} from './db';
import {verifyProKey,type ProIdentity} from './pro-auth';
import {ensureActiveSubscription} from './subscription-access';
import {sellerPlan} from './seller-plan';
import {ShopError} from './multi-shop-service';
import type {Query} from './order-service';
export const freeOwner=(token:string)=>createHash('sha256').update('sellpostly-free:'+token).digest('hex');
export function sellerCredential(request:Request,header:'x-pro-key'|'x-shop-key'){
 const explicit=request.headers.get(header)?.trim();if(explicit)return explicit;
 const name=header==='x-pro-key'?'sellpostly-pro-key':'sellpostly-free-shop-key';
 for(const pair of (request.headers.get('cookie')||'').split(';')){const at=pair.indexOf('=');if(pair.slice(0,at).trim()===name)try{return decodeURIComponent(pair.slice(at+1)).trim();}catch{return '';}}
 return '';
}
type Dependencies={query?:Query;verifyKey?:(key:string)=>Promise<ProIdentity|null>};
export async function resolveSellerPlan(request:Request,deps:Dependencies={}){
 const query=deps.query||(async(sql,args)=>(await db()).query(sql,args)),key=sellerCredential(request,'x-pro-key'),token=sellerCredential(request,'x-shop-key');
 const raw=key?await (deps.verifyKey||verifyProKey)(key):null;
 if(!deps.query&&!process.env.DATABASE_URL)return raw?{...raw,tier:'pro' as const}:null;
 const session=/^[a-f0-9]{64}$/i.test(token)?(await query("SELECT owner_key,provider FROM subscriptions WHERE owner_key=$1 AND provider='free' AND status='active'",[freeOwner(token)]))[0]:undefined;
 const valid=raw&&await ensureActiveSubscription(raw,query)?raw:null;
 if(!valid)return session?{ownerKey:session.owner_key,provider:'free' as const,tier:await sellerPlan(session.owner_key,query)}:null;
 let linked=(await query('SELECT account_owner FROM shop_account_links WHERE pro_owner=$1',[valid.ownerKey]))[0];
 if(session&&session.owner_key!==valid.ownerKey){
  if(linked&&linked.account_owner!==session.owner_key)throw new ShopError('LICENSE_ACCOUNT_CONFLICT',409);
  if(!linked){await query(`INSERT INTO shop_account_links(pro_owner,account_owner)
   SELECT $1,$2 WHERE NOT EXISTS(SELECT 1 FROM shops WHERE owner_key=$1)
   AND NOT EXISTS(SELECT 1 FROM shop_account_links WHERE pro_owner=$1 OR account_owner=$2)
   ON CONFLICT DO NOTHING`,[valid.ownerKey,session.owner_key]);
   linked=(await query('SELECT account_owner FROM shop_account_links WHERE pro_owner=$1',[valid.ownerKey]))[0];
   if(!linked||linked.account_owner!==session.owner_key)throw new ShopError('LICENSE_ACCOUNT_CONFLICT',409);
  }
 }
 const owner=linked?.account_owner||valid.ownerKey;
 const rows=await query(`UPDATE subscriptions a SET plan='pro',plan_source=$2,
  plan_expires_at=(SELECT expires_at FROM subscriptions WHERE owner_key=$2),
  plan_override=CASE WHEN a.plan_override='free' THEN NULL ELSE a.plan_override END,
  plan_changed_at=CASE WHEN a.plan<>'pro' OR a.plan_override='free' THEN now() ELSE a.plan_changed_at END
  WHERE a.owner_key=$1 AND a.status='active' RETURNING owner_key`,[owner,valid.ownerKey]);
 if(!rows[0])return null;
 return {...valid,ownerKey:owner,tier:await sellerPlan(owner,query)};
}
