import 'server-only';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {validWallet} from '../app/shop/crypto-data';
import { randomBytes } from 'node:crypto';
import type { Query } from "./order-service";
import type { ProIdentity } from './pro-auth';
import { validateShop, type Shop,type ShopMode } from '../app/shop/shop-data';
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
export const PUBLISH_SHOP_SQL=`INSERT INTO shops(owner_key,slug,name,logo,catalog,affiliate_catalog,personal_catalog,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled,affiliate_disclosure)
 SELECT $1,$2,$3,$4,$5::jsonb,CASE WHEN coalesce($5::jsonb->>'shopMode','affiliate')='affiliate' THEN $5::jsonb ELSE jsonb_set(jsonb_set($5::jsonb-'heroTitle'-'heroSubtitle'-'heroImage'-'shopAccent','{shopMode}','\"affiliate\"'),'{products}','[]') END,CASE WHEN $5::jsonb->>'shopMode'='personal' THEN $5::jsonb ELSE jsonb_set(jsonb_set($5::jsonb-'heroTitle'-'heroSubtitle'-'heroImage'-'shopAccent','{shopMode}','\"personal\"'),'{products}','[]') END,CASE WHEN $5::jsonb->>'shopMode'='personal' THEN coalesce($5::jsonb->>'cryptoWallet','') ELSE '' END,CASE WHEN $5::jsonb->>'shopMode'='personal' THEN coalesce($5::jsonb->>'sellerEmail','') ELSE '' END,coalesce(($5::jsonb->>'codEnabled')::boolean,true),coalesce(($5::jsonb->>'escrowEnabled')::boolean,true),CASE WHEN coalesce($5::jsonb->>'shopMode','affiliate')='affiliate' THEN coalesce($5::jsonb->>'affiliateDisclosure','') ELSE '' END FROM subscriptions WHERE owner_key=$1 AND status='active' AND (expires_at IS NULL OR expires_at>now())
 ON CONFLICT(owner_key) DO UPDATE SET name=excluded.name,logo=excluded.logo,catalog=excluded.catalog,affiliate_catalog=CASE WHEN coalesce(excluded.catalog->>'shopMode','affiliate')='affiliate' THEN excluded.affiliate_catalog ELSE coalesce(shops.affiliate_catalog,excluded.affiliate_catalog) END,personal_catalog=CASE WHEN excluded.catalog->>'shopMode'='personal' THEN excluded.personal_catalog ELSE coalesce(shops.personal_catalog,excluded.personal_catalog) END,seller_usdc_wallet=CASE WHEN excluded.catalog->>'shopMode'='personal' THEN excluded.seller_usdc_wallet ELSE shops.seller_usdc_wallet END,seller_email=CASE WHEN excluded.catalog->>'shopMode'='personal' THEN excluded.seller_email ELSE shops.seller_email END,cod_enabled=CASE WHEN excluded.catalog->>'shopMode'='personal' THEN excluded.cod_enabled ELSE shops.cod_enabled END,escrow_enabled=CASE WHEN excluded.catalog->>'shopMode'='personal' THEN excluded.escrow_enabled ELSE shops.escrow_enabled END,affiliate_disclosure=CASE WHEN coalesce(excluded.catalog->>'shopMode','affiliate')='affiliate' THEN excluded.affiliate_disclosure ELSE shops.affiliate_disclosure END,published=true,updated_at=now()
 RETURNING slug,escrow_hold_days`;
export async function publishShop(identity:ProIdentity,value:unknown){
  const {escrowHoldDays:_ignored,...shop}=validateShop(value);
  if(shop.shopMode==='personal'&&shop.cryptoWallet&&!validWallet(shop.cryptoWallet,'Polygon'))throw Error('INVALID_WALLET');
  if(shop.shopMode==='personal'&&shop.sellerEmail&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(shop.sellerEmail))throw Error('INVALID_CONTACT');
  const sql=db();
  const slug='store-'+randomBytes(9).toString('hex');
  const results=await sql.transaction([
    sql`INSERT INTO subscriptions(owner_key,provider) VALUES(${identity.ownerKey},${identity.provider}) ON CONFLICT(owner_key) DO UPDATE SET provider=excluded.provider,verified_at=now()`,
    sql.query(PUBLISH_SHOP_SQL,[identity.ownerKey,slug,shop.name,shop.logo||"",JSON.stringify(shop)])
  ]);
  if(!results[1][0])throw Error("PRO_REQUIRED");
  return String(results[1][0].slug);
}
export async function publicShop(slug:string,query:Query=async(sql,parameters)=>await db().query(sql,parameters),mode?:ShopMode):Promise<(Shop & {verified:boolean;suspended:boolean})|null>{
  if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug))return null;
  const rows=await query("SELECT affiliate_disclosure,catalog,affiliate_catalog,personal_catalog,seller_usdc_wallet,cod_enabled,escrow_enabled,verified,suspended,escrow_hold_days FROM shops WHERE slug=$1 AND published=true LIMIT 1",[slug]);
  const row=rows[0];if(!row)return null;
  const catalog=mode?(row[mode+'_catalog']??(row.catalog?.shopMode===mode?row.catalog:null)):row.catalog;
  if(!catalog)return null;
  const shop=validateShop(catalog);if(mode&&shop.shopMode!==mode)return null;
  return {...shop,...(shop.shopMode==='affiliate'?{affiliateDisclosure:row.affiliate_disclosure??shop.affiliateDisclosure}:{}),...(shop.shopMode==='personal'?{cryptoWallet:row.seller_usdc_wallet||shop.cryptoWallet,codEnabled:row.cod_enabled??shop.codEnabled,escrowEnabled:row.escrow_enabled??shop.escrowEnabled}:{}),escrowHoldDays:row.escrow_hold_days,verified:row.verified===true,suspended:row.suspended===true};
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
 const rows=await query("SELECT id,slug,escrow_hold_days,affiliate_disclosure,affiliate_catalog,personal_catalog,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled FROM shops WHERE owner_key=$1",[owner]);return rows[0]||{escrow_hold_days:7};
}
