import 'server-only';
import { db } from './db';
import { ApiError,object,text,uuid,network,txId } from './order-validation';
import type { Query } from './order-service';
const run:Query=async(sql,parameters)=>await db().query(sql,parameters);
export const ADMIN_OVERVIEW_SQL=`WITH buckets AS (SELECT coin,network FROM orders WHERE payment_method='CRYPTO' UNION SELECT coin,network FROM payout_requests),
 balances AS (SELECT b.coin,b.network,
 (SELECT coalesce(sum(gross_amount),0)::text FROM orders WHERE coin=b.coin AND network=b.network AND status IN ('held','released','disputed')) AS total_gmv,
 (SELECT coalesce(sum(commission_amount),0)::text FROM orders WHERE coin=b.coin AND network=b.network AND status IN ('held','released','disputed')) AS total_commission_5pct,
 (SELECT coalesce(sum(gross_amount),0)::text FROM orders WHERE coin=b.coin AND network=b.network AND status IN ('held','disputed')) AS active_escrow_held,
 (SELECT coalesce(sum(amount),0)::text FROM payout_requests WHERE coin=b.coin AND network=b.network AND status IN ('pending','approved')) AS pending_payouts,
 (SELECT coalesce(sum(amount),0)::text FROM payout_requests WHERE coin=b.coin AND network=b.network AND status='paid') AS paid_payouts FROM buckets b)
 SELECT coalesce((SELECT json_agg(b ORDER BY coin,network) FROM balances b),'[]') AS balances,
 (SELECT count(*)::text FROM subscriptions WHERE status='active' AND (expires_at IS NULL OR expires_at>now())) AS active_subscriptions,
 coalesce((SELECT json_agg(to_jsonb(o)||jsonb_build_object('gross_amount',o.gross_amount::text,'commission_rate',o.commission_rate::text,'commission_amount',o.commission_amount::text,'net_amount',o.net_amount::text,'shop_name',s.name,'seller_wallet',coalesce(nullif(o.details->>'seller_wallet',''),s.seller_usdc_wallet),'buyer_email',CASE WHEN o.details->'buyer'->>'contact' LIKE '%@%' THEN o.details->'buyer'->>'contact' END) ORDER BY o.created_at DESC,o.id) FROM orders o JOIN shops s ON s.id=o.shop_id),'[]') AS orders,
 coalesce((SELECT json_agg(to_jsonb(p)||jsonb_build_object('amount',p.amount::text,'shop_name',s.name) ORDER BY p.created_at DESC,p.id) FROM payout_requests p JOIN shops s ON s.id=p.shop_id),'[]') AS payouts,
 coalesce((SELECT json_agg(json_build_object('id',s.id,'name',s.name,'slug',s.slug,'owner_key',s.owner_key,'verified',s.verified,'suspended',s.suspended,'published',s.published,'escrow_hold_days',s.escrow_hold_days,'created_at',s.created_at) ORDER BY s.created_at DESC,s.id) FROM shops s),'[]') AS shops`;
export async function overview(query:Query=run){return (await query(ADMIN_OVERVIEW_SQL,[]))[0];}
export async function subscriptions(query:Query=run){return query("SELECT owner_key,provider,CASE WHEN status='active' AND expires_at<=now() THEN 'expired' ELSE status END AS status,expires_at,verified_at,created_at FROM subscriptions ORDER BY created_at DESC,owner_key",[]);}
export async function adminOrder(id:string,query:Query=run){
 uuid(id);const rows=await query(`SELECT to_jsonb(o)||jsonb_build_object('gross_amount',gross_amount::text,'commission_amount',commission_amount::text,'net_amount',net_amount::text) AS record FROM orders o WHERE id=$1::uuid`,[id]);
 if(!rows.length)throw new ApiError('RECORD_NOT_FOUND',404);return rows[0].record;
}
export const ADMIN_ORDER_UPDATE_SQL=`UPDATE orders SET
 status=CASE $2 WHEN 'verify' THEN 'held' WHEN 'release' THEN 'released' WHEN 'refund' THEN 'refunded' ELSE 'cancelled' END,
 payment_verified_at=CASE WHEN $2='verify' THEN now() ELSE payment_verified_at END,
 force_released_at=CASE WHEN $2='release' AND escrow_release_at>now() AND $5::boolean THEN now() ELSE force_released_at END,
 details=details || jsonb_build_object('admin_actions',coalesce(details->'admin_actions','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action',$2::text,'note',$3::text,'force_release',$5::boolean,'at',now())))
 WHERE id=$1::uuid AND payment_method='CRYPTO' AND (
 ($2='verify' AND status='pending' AND tx_id IS NOT NULL AND tx_id=$4::text) OR
 ($2='release' AND status IN ('held','disputed') AND payment_verified_at IS NOT NULL AND (escrow_release_at<=now() OR ($5::boolean AND nullif(details->>'buyer_confirmed_at','') IS NOT NULL))) OR
 ($2='refund' AND status IN ('held','disputed')) OR ($2='cancel' AND status='pending'))
 RETURNING id,status,payment_verified_at,escrow_release_at,force_released_at,gross_amount::text,commission_amount::text,net_amount::text`;
export async function updateOrder(id:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),action=text(raw.action,16);
 if(!['verify','release','refund','cancel'].includes(action))throw new ApiError('INVALID_INPUT');
 if(raw.forceRelease!==undefined&&typeof raw.forceRelease!=='boolean')throw new ApiError('INVALID_INPUT');
 const force=raw.forceRelease===true;
 if(force&&action!=='release')throw new ApiError('INVALID_INPUT');
 const note=raw.note===undefined?'':text(raw.note,1000,false);
 let verifiedTx:string|null=null;
 if(action==='verify'){const order=await adminOrder(id,query);txId(order.tx_id,network(order.network));verifiedTx=order.tx_id;}
 if(force){
  const order=await adminOrder(id,query);
  const confirmed=Date.parse(order.details?.buyer_confirmed_at||'');
  const paid=Date.parse(order.payment_verified_at||'');
  if(!Number.isFinite(confirmed)||!Number.isFinite(paid)||confirmed<paid)throw new ApiError('BUYER_CONFIRMATION_REQUIRED',409);
 }
 const rows=await query(ADMIN_ORDER_UPDATE_SQL,[id,action,note,verifiedTx,force]);
 if(!rows.length)throw new ApiError('TRANSITION_NOT_ALLOWED',409);return rows[0];
}
export async function adminPayout(id:string,query:Query=run){
 uuid(id);const rows=await query('SELECT id,shop_id,amount::text,coin,network,wallet,status,tx_id,created_at FROM payout_requests WHERE id=$1::uuid',[id]);
 if(!rows.length)throw new ApiError('RECORD_NOT_FOUND',404);return rows[0];
}
export const ADMIN_PAYOUT_UPDATE_SQL=`UPDATE payout_requests SET
 status=CASE $2 WHEN 'approve' THEN 'approved' WHEN 'paid' THEN 'paid' ELSE 'rejected' END,
 tx_id=CASE WHEN $2='paid' THEN coalesce($3::text,tx_id) ELSE tx_id END
 WHERE id=$1::uuid AND (($2='approve' AND status='pending') OR ($2='paid' AND status='approved') OR ($2='reject' AND status IN ('pending','approved')))
 RETURNING id,status,tx_id,amount::text,coin,network`;
export async function updatePayout(id:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value),action=text(raw.action,16);
 if(!['approve','paid','reject'].includes(action))throw new ApiError('INVALID_INPUT');
 const payout=await adminPayout(id,query);
 const tx=action==='paid'&&raw.tx_id?txId(raw.tx_id,network(payout.network)):null;
 const rows=await query(ADMIN_PAYOUT_UPDATE_SQL,[id,action,tx]);
 if(!rows.length)throw new ApiError('TRANSITION_NOT_ALLOWED',409);return rows[0];
}
export async function adminShop(id:string,query:Query=run){
 uuid(id);const rows=await query('SELECT id,name,slug,owner_key,verified,suspended,published,escrow_hold_days FROM shops WHERE id=$1::uuid',[id]);
 if(!rows.length)throw new ApiError('RECORD_NOT_FOUND',404);return rows[0];
}
export async function updateShop(id:string,value:unknown,query:Query=run){
 uuid(id);const raw=object(value);
 if(raw.verified===undefined&&raw.suspended===undefined&&raw.escrow_hold_days===undefined)throw new ApiError('INVALID_INPUT');
 for(const key of ['verified','suspended'])if(raw[key]!==undefined&&typeof raw[key]!=='boolean')throw new ApiError('INVALID_INPUT');
 const days=raw.escrow_hold_days;
 if(days!==undefined&&(typeof days!=='number'||!Number.isInteger(days)||days<3||days>15))throw new ApiError('INVALID_HOLD_PERIOD');
 const rows=await query('UPDATE shops SET verified=coalesce($2::boolean,verified),suspended=coalesce($3::boolean,suspended),escrow_hold_days=coalesce($4::integer,escrow_hold_days),updated_at=now() WHERE id=$1::uuid RETURNING id,name,slug,verified,suspended,escrow_hold_days',[id,raw.verified??null,raw.suspended??null,days??null]);
 if(!rows.length)throw new ApiError('RECORD_NOT_FOUND',404);return rows[0];
}
export async function updateSubscription(value:unknown,query:Query=run){
 const raw=object(value),owner=text(raw.owner_key,64),action=text(raw.action,16);
 if(!/^[a-f0-9]{64}$/.test(owner)||!['activate','revoke'].includes(action))throw new ApiError('INVALID_INPUT');
 const rows=await query(`UPDATE subscriptions SET status=CASE $2 WHEN 'activate' THEN 'active' ELSE 'revoked' END WHERE owner_key=$1 RETURNING owner_key,provider,status,verified_at`,[owner,action]);
 if(!rows.length)throw new ApiError('RECORD_NOT_FOUND',404);return rows[0];
}

