import 'server-only';
import {db} from './db';
import {ApiError,object,text} from './order-validation';
import type {Query} from './order-service';
const run:Query=async(sql,args)=>db().query(sql,args);
export async function sellerAccounts(search='',query:Query=run){
 const value=search.trim().slice(0,120);
 return query(`SELECT s.owner_key,s.email,s.status,s.provider,s.plan_override,s.plan_changed_at,seller_effective_plan(s.owner_key) AS plan,
 coalesce((SELECT json_agg(sh.name ORDER BY sh.name) FROM shops sh WHERE sh.owner_key=s.owner_key AND sh.deleted_at IS NULL),'[]') AS shops,
 (SELECT count(*)::integer FROM shops sh WHERE sh.owner_key=s.owner_key AND sh.deleted_at IS NULL AND sh.store_mode='niche') AS niche_count
 FROM subscriptions s WHERE NOT EXISTS(SELECT 1 FROM shop_account_links l WHERE l.pro_owner=s.owner_key)
 AND ($1='' OR s.owner_key ILIKE '%'||$1||'%' OR coalesce(s.email,'') ILIKE '%'||$1||'%' OR EXISTS(SELECT 1 FROM shops sh WHERE sh.owner_key=s.owner_key AND sh.deleted_at IS NULL AND (sh.name ILIKE '%'||$1||'%' OR sh.seller_email ILIKE '%'||$1||'%')))
 ORDER BY s.created_at DESC,s.owner_key LIMIT 200`,[value]);
}
export async function setSellerPlan(value:unknown,query:Query=run){
 const raw=object(value),owner=text(raw.owner_key,64);if(!/^[a-f0-9]{64}$/.test(owner)||!['free','pro'].includes(String(raw.plan)))throw new ApiError('INVALID_INPUT');
 const rows=await query(`UPDATE subscriptions SET plan_override=$2,status='active',plan_changed_at=now() WHERE owner_key=coalesce((SELECT account_owner FROM shop_account_links WHERE pro_owner=$1),$1) RETURNING owner_key,plan_override AS plan,plan_changed_at`,[owner,raw.plan]);
 if(!rows[0])throw new ApiError('RECORD_NOT_FOUND',404);return rows[0];
}
