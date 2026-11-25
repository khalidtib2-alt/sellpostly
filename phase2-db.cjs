const fs=require('fs');const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let p='src/app/shop/shop-data.ts',s=read(p).replace('export type Shop = {','export type Shop = { codEnabled?:boolean; escrowEnabled?:boolean; sellerEmail?:string;');s=s.replace('return {logo:', 'return {codEnabled:raw.codEnabled!==false,escrowEnabled:raw.escrowEnabled!==false,sellerEmail:text(raw.sellerEmail,254).trim(),logo:');write(p,s);
p='src/lib/db.ts';s=read(p);s=s.replace("type Shop }", "type Shop,type ShopMode }");
s=s.replace("import { randomBytes }", "import {validWallet} from '../app/shop/crypto-data';\nimport { randomBytes }");
const start=s.indexOf('export const PUBLISH_SHOP_SQL='),end=s.indexOf('export async function publishShop',start);
s=s.slice(0,start)+`export const PUBLISH_SHOP_SQL=\`INSERT INTO shops(owner_key,slug,name,logo,catalog,affiliate_catalog,personal_catalog,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled)
 SELECT $1,$2,$3,$4,$5::jsonb,CASE WHEN coalesce($5::jsonb->>'shopMode','affiliate')='affiliate' THEN $5::jsonb END,CASE WHEN $5::jsonb->>'shopMode'='personal' THEN $5::jsonb END,coalesce($5::jsonb->>'cryptoWallet',''),coalesce($5::jsonb->>'sellerEmail',''),coalesce(($5::jsonb->>'codEnabled')::boolean,true),coalesce(($5::jsonb->>'escrowEnabled')::boolean,true) FROM subscriptions WHERE owner_key=$1 AND status='active' AND (expires_at IS NULL OR expires_at>now())
 ON CONFLICT(owner_key) DO UPDATE SET name=excluded.name,logo=excluded.logo,catalog=excluded.catalog,affiliate_catalog=coalesce(excluded.affiliate_catalog,shops.affiliate_catalog),personal_catalog=coalesce(excluded.personal_catalog,shops.personal_catalog),seller_usdc_wallet=CASE WHEN excluded.personal_catalog IS NOT NULL THEN excluded.seller_usdc_wallet ELSE shops.seller_usdc_wallet END,seller_email=CASE WHEN excluded.personal_catalog IS NOT NULL THEN excluded.seller_email ELSE shops.seller_email END,cod_enabled=CASE WHEN excluded.personal_catalog IS NOT NULL THEN excluded.cod_enabled ELSE shops.cod_enabled END,escrow_enabled=CASE WHEN excluded.personal_catalog IS NOT NULL THEN excluded.escrow_enabled ELSE shops.escrow_enabled END,published=true,updated_at=now()
 RETURNING slug,escrow_hold_days\`;
`+s.slice(end);
s=s.replace('const sql=db();\n  const slug=', `if(shop.cryptoWallet&&!validWallet(shop.cryptoWallet,'Polygon'))throw Error('INVALID_WALLET');
  if(shop.sellerEmail&&!/^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$/.test(shop.sellerEmail))throw Error('INVALID_CONTACT');
  const sql=db();\n  const slug=`);
s=s.replace('await db().query(sql,parameters)):Promise<(Shop', 'await db().query(sql,parameters),mode?:ShopMode):Promise<(Shop');
s=s.replace('SELECT catalog,verified,suspended,escrow_hold_days FROM shops', 'SELECT catalog,affiliate_catalog,personal_catalog,seller_usdc_wallet,cod_enabled,escrow_enabled,verified,suspended,escrow_hold_days FROM shops');
s=s.replace('return rows[0]?{...validateShop(rows[0].catalog),escrowHoldDays:rows[0].escrow_hold_days,verified:rows[0].verified===true,suspended:rows[0].suspended===true}:null;',`const row=rows[0];if(!row)return null;
  const catalog=mode?(row[mode+'_catalog']??(row.catalog?.shopMode===mode?row.catalog:null)):row.catalog;
  if(!catalog)return null;
  const shop=validateShop(catalog);if(mode&&shop.shopMode!==mode)return null;
  return {...shop,...(shop.shopMode==='personal'?{cryptoWallet:row.seller_usdc_wallet||shop.cryptoWallet,codEnabled:row.cod_enabled??shop.codEnabled,escrowEnabled:row.escrow_enabled??shop.escrowEnabled}:{}),escrowHoldDays:row.escrow_hold_days,verified:row.verified===true,suspended:row.suspended===true};`);
s=s.replace('SELECT id,escrow_hold_days FROM shops WHERE owner_key=$1','SELECT id,slug,escrow_hold_days,affiliate_catalog,personal_catalog,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled FROM shops WHERE owner_key=$1');write(p,s);
