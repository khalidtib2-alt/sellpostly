import 'server-only';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
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
  const statements=schema.split('-- statement-breakpoint').map(value=>value.trim()).filter(Boolean);
  await sql.transaction(statements.map(statement=>sql.query(statement)),{isolationLevel:'Serializable'});
}
export async function recordSubscription(identity:ProIdentity){
  const sql=db();
  await sql`INSERT INTO subscriptions(owner_key,provider) VALUES(${identity.ownerKey},${identity.provider}) ON CONFLICT(owner_key) DO UPDATE SET provider=excluded.provider,status='active',verified_at=now()`;
}
export async function publishShop(identity:ProIdentity,value:unknown){
  const shop=validateShop(value);
  const sql=db();
  const slug='store-'+randomBytes(9).toString('hex');
  const results=await sql.transaction([
    sql`INSERT INTO subscriptions(owner_key,provider) VALUES(${identity.ownerKey},${identity.provider}) ON CONFLICT(owner_key) DO UPDATE SET provider=excluded.provider,status='active',verified_at=now()`,
    sql`INSERT INTO shops(owner_key,slug,name,logo,escrow_hold_days,catalog) VALUES(${identity.ownerKey},${slug},${shop.name},${shop.logo||''},${shop.escrowHoldDays||7},${JSON.stringify(shop)}::jsonb) ON CONFLICT(owner_key) DO UPDATE SET name=excluded.name,logo=excluded.logo,escrow_hold_days=excluded.escrow_hold_days,catalog=excluded.catalog,published=true,updated_at=now() RETURNING slug`
  ]);
  return String(results[1][0].slug);
}
export async function publicShop(slug:string):Promise<Shop|null>{
  if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug))return null;
  const sql=db();
  const rows=await sql`SELECT catalog FROM shops WHERE slug=${slug} AND published=true LIMIT 1`;
  return rows[0]?validateShop(rows[0].catalog):null;
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
