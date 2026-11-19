import 'server-only';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Query } from "./order-service";
import type { ProIdentity } from './pro-auth';
import { validateShop, type Shop } from '../app/shop/shop-data';
export function db(){
  if(!process.env.DATABASE_URL)throw Error('DATABASE_NOT_CONFIGURED');
  return neon(process.env.DATABASE_URL);
}
export async function initializeDatabase(){
  const schema=await readFile(path.join(process.cwd(),'src/db/schema.sql'),'utf8');
  const sql=db();
  // Fixed repository-owned statements only; no request text is executed as SQL.
  const statements=schema.split(/^[ \t]*-- statement-breakpoint[ \t]*\r?$/m).map(value=>value.trim()).filter(Boolean);
  await sql.transaction(statements.map(statement=>sql.query(statement)),{isolationLevel:'Serializable'});
}
export async function recordSubscription(identity:ProIdentity){
  const sql=db();
  await sql`INSERT INTO subscriptions(owner_key,provider) VALUES(${identity.ownerKey},${identity.provider}) ON CONFLICT(owner_key) DO UPDATE SET provider=excluded.provider,verified_at=now()`;
}
export const PUBLISH_SHOP_SQL=`INSERT INTO shops(owner_key,slug,name,logo,catalog)
 SELECT $1,$2,$3,$4,$5::jsonb FROM subscriptions WHERE owner_key=$1 AND status='active' AND (expires_at IS NULL OR expires_at>now())
 ON CONFLICT(owner_key) DO UPDATE SET name=excluded.name,logo=excluded.logo,catalog=excluded.catalog,published=true,updated_at=now()
 RETURNING slug,escrow_hold_days`;
export async function publishShop(identity:ProIdentity,value:unknown){
  const {escrowHoldDays:_ignored,...shop}=validateShop(value);
  const sql=db();
  const slug='store-'+randomBytes(9).toString('hex');
  const results=await sql.transaction([
    sql`INSERT INTO subscriptions(owner_key,provider) VALUES(${identity.ownerKey},${identity.provider}) ON CONFLICT(owner_key) DO UPDATE SET provider=excluded.provider,verified_at=now()`,
    sql.query(PUBLISH_SHOP_SQL,[identity.ownerKey,slug,shop.name,shop.logo||"",JSON.stringify(shop)])
  ]);
  if(!results[1][0])throw Error("PRO_REQUIRED");
  return String(results[1][0].slug);
}
export async function publicShop(slug:string,query:Query=async(sql,parameters)=>await db().query(sql,parameters)):Promise<(Shop & {verified:boolean;suspended:boolean})|null>{
  if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug))return null;
  const rows=await query("SELECT catalog,verified,suspended,escrow_hold_days FROM shops WHERE slug=$1 AND published=true LIMIT 1",[slug]);
  return rows[0]?{...validateShop(rows[0].catalog),escrowHoldDays:rows[0].escrow_hold_days,verified:rows[0].verified===true,suspended:rows[0].suspended===true}:null;
}
export async function createPendingOrder(shopId:string,grossAmount:string,coin:'USDC'|'USDT',network:string,details:unknown){
  const sql=db();
  const rows=await sql`INSERT INTO orders(shop_id,gross_amount,coin,network,details) VALUES(${shopId}::uuid,${grossAmount}::numeric,${coin},${network},${JSON.stringify(details)}::jsonb) RETURNING id,gross_amount,commission_amount,net_amount,escrow_hold_days,status`;
  return rows[0];
}
export async function requestPayout(identity:ProIdentity,shopId:string,amount:string,coin:'USDC'|'USDT',network:string,wallet:string){
  const sql=db();
  return sql`SELECT request_seller_payout(${shopId}::uuid,${identity.ownerKey},${amount}::numeric,${coin},${network},${wallet}) AS id`;
}

export async function sellerShopSettings(owner:string,query:Query=async(sql,parameters)=>await db().query(sql,parameters)){
 const rows=await query("SELECT id,escrow_hold_days FROM shops WHERE owner_key=$1",[owner]);return rows[0]||{escrow_hold_days:7};
}
