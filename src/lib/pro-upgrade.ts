import 'server-only';
import {b2bPlanPrice} from './b2b-plan';
import {locale} from './locale';
import { createHash,randomBytes } from 'node:crypto';
import { db } from './db';
import {validWallet} from '../app/shop/crypto-data';
import { ApiError,object,text,txId,uuid } from './order-validation';
import type { Query } from './order-service';
const run:Query=async(sql,args)=>await (await db()).query(sql,args);
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function upgradePrice(plan:string){
 if(plan==='b2b')return b2bPlanPrice(process.env.NEXT_PUBLIC_B2B_PLAN_PRICE);
 const configured=plan==='monthly'?(process.env.NEXT_PUBLIC_PRO_PRICE_USD||'15'):process.env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD;
 if(!configured||!/^\d{1,6}(\.\d{1,2})?$/.test(configured)||Number(configured)<=0)throw new ApiError('PLAN_UNAVAILABLE',503);
 return configured;
}
export function upgradeInput(value:unknown){
 const raw=object(value),email=text(raw.email,254).toLowerCase(),plan=raw.plan??'monthly';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['monthly','lifetime','b2b'].includes(String(plan))||!['USDC','USDT'].includes(String(raw.coin))||(raw.network!==undefined&&raw.network!=='Polygon'))throw new ApiError('INVALID_INPUT');
 return {email,plan:String(plan),coin:String(raw.coin),tx:txId(raw.tx_id,'Polygon'),amount:upgradePrice(String(plan))};
}
export async function requestUpgrade(value:unknown,query:Query=run){
 const input=upgradeInput(value);
 if(!validWallet((process.env.NEXT_PUBLIC_ESCROW_WALLET||'').trim(),'Polygon')||(process.env.NEXT_PUBLIC_ESCROW_NETWORK||'Polygon').trim()!=='Polygon')throw new ApiError('ESCROW_UNAVAILABLE',503);
 const token=randomBytes(32).toString('hex');
 const rows=await query(`INSERT INTO pro_upgrade_requests(email,plan,amount_usd,coin,tx_id,receipt_token_hash,language)
 VALUES($1,$2,$3::numeric,$4,$5,$6,$7) RETURNING id,status,amount_usd::text`,[input.email,input.plan,input.amount,input.coin,input.tx,digest(token),locale(object(value).language)]);
 return {id:String(rows[0].id),status:String(rows[0].status),amount_usd:String(rows[0].amount_usd),receipt_token:token,tx_id:input.tx};
}
export async function upgradeStatus(tx:string,email:string,token:string,query:Query=run){
 tx=txId(tx,'Polygon');email=text(email,254).toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError('REQUEST_NOT_FOUND',404);
 const rows=await query(`SELECT id,status,plan,amount_usd::text,coin,network,issued_license_key,created_at
 FROM pro_upgrade_requests WHERE tx_id=$1 AND email=$2 AND receipt_token_hash=$3`,[tx,email,digest(token)]);
 if(!rows.length)throw new ApiError('REQUEST_NOT_FOUND',404);return rows[0];
}
export async function listUpgrades(query:Query=run){
 return query('SELECT id,email,plan,amount_usd::text,coin,network,tx_id,status,issued_license_key,created_at FROM pro_upgrade_requests ORDER BY created_at DESC',[]);
}
export async function decideUpgrade(value:unknown,query:Query=run){
 const raw=object(value),id=uuid(raw.id),action=text(raw.action,16);
 if(action==='approve'){
  const key='SP-PRO-'+randomBytes(32).toString('hex').toUpperCase();
  const rows=await query('SELECT approve_pro_upgrade_request($1::uuid,$2,$3) AS issued_license_key',[id,key,digest('sellpostly-license:'+key)]);
  return {status:'approved',issued_license_key:rows[0].issued_license_key};
 }
 if(action!=='reject')throw new ApiError('INVALID_INPUT');
 const rows=await query("UPDATE pro_upgrade_requests SET status='rejected' WHERE id=$1::uuid AND status='pending' RETURNING id,status",[id]);
 if(!rows.length)throw new ApiError('TRANSITION_NOT_ALLOWED',409);return rows[0];
}
