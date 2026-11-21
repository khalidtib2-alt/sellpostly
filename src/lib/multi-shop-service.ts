import 'server-only';
import {storePolicyReady} from '../app/shop/store-policy-data';
import {validTronChecksum} from './tron-validation';
import {db} from './db';
import type {Query} from './order-service';
import {validateShop,type Shop,type ShopMode} from '../app/shop/shop-data';
export const runShopQuery:Query=async(sql,args)=>await db().query(sql,args);
export class ShopError extends Error{constructor(message:string,public status=400){super(message);}}
export function validShopSlug(value:unknown):value is string{return typeof value==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(value);}
export async function listSellerShops(owner:string,query:Query=runShopQuery){
 const rows=await query('SELECT id,slug,name,published,suspended,catalog,affiliate_catalog,personal_catalog,store_mode,shop_type,niche_name,escrow_hold_days,affiliate_disclosure,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled FROM shops WHERE owner_key=$1 AND deleted_at IS NULL ORDER BY created_at,id',[owner]);
 const shops:Shop[]=[];const primary=rows.find(row=>row.store_mode==='general'&&row.published!==false&&row.suspended!==true);
 for(const row of rows){for(const mode of (row.store_mode==='niche'?[row.shop_type]:['personal','affiliate']) as ShopMode[]){
 const catalog=row[mode+'_catalog']||((row.catalog?.shopMode||'affiliate')===mode?row.catalog:null)||{name:row.name||'',bio:'',products:[]};
 const mainCatalog=primary&&(primary[mode+'_catalog']||primary.catalog);
 shops.push(validateShop({...catalog,mainStoreSlug:row.store_mode==='niche'&&mainCatalog?.shopMode===mode?primary?.slug:undefined,shopMode:mode,shopId:row.id,customSlug:row.slug,storeMode:row.store_mode||'general',nicheName:row.niche_name||'',escrowHoldDays:row.escrow_hold_days,...(mode==='affiliate'?{affiliateDisclosure:row.affiliate_disclosure??catalog.affiliateDisclosure}:{cryptoWallet:row.seller_usdc_wallet||catalog.cryptoWallet,sellerEmail:row.seller_email||catalog.sellerEmail,codEnabled:row.cod_enabled,escrowEnabled:row.escrow_enabled})}));
 }}return shops;
}
export const CREATE_NICHE_SQL=`INSERT INTO shops(owner_key,slug,name,logo,catalog,affiliate_catalog,personal_catalog,store_mode,shop_type,niche_name,affiliate_disclosure,seller_usdc_wallet,seller_email,cod_enabled,escrow_enabled)
 SELECT $1,$2,$3,'',$4::jsonb,CASE WHEN $5='affiliate' THEN $4::jsonb END,CASE WHEN $5='personal' THEN $4::jsonb END,'niche',$5,$6,coalesce($4::jsonb->>'affiliateDisclosure',''),'','',false,false
 FROM subscriptions WHERE owner_key=$1 AND seller_effective_plan($1)='pro' AND status='active' RETURNING id,slug`;
export async function createNicheShop(owner:string,value:unknown,query:Query=runShopQuery){
 const raw=value as Record<string,unknown>;
 if(!raw||!validShopSlug(raw.customSlug)||!['personal','affiliate'].includes(String(raw.shopMode))||typeof raw.name!=='string'||!raw.name.trim()||typeof raw.nicheName!=='string'||!raw.nicheName.trim())throw new ShopError('INVALID_NICHE_SHOP');
 const shop=validateShop({...raw,shopId:undefined,storeMode:'niche',products:[],escrowEnabled:false,codEnabled:false,payments:{USDC_DIRECT:{enabled:false},COD:{enabled:false}}});
 try{const rows=await query(CREATE_NICHE_SQL,[owner,shop.customSlug,shop.name,JSON.stringify(shop),shop.shopMode,shop.nicheName]);if(!rows[0])throw new ShopError('PRO_REQUIRED',403);return {...shop,shopId:rows[0].id,customSlug:rows[0].slug};}
 catch(e){const err=e as {code?:string;message?:string};if(err.code==='23505')throw new ShopError('SLUG_UNAVAILABLE',409);if(err.message?.includes('NICHE_LIMIT_REACHED'))throw new ShopError('NICHE_LIMIT_REACHED',409);throw e;}
}
export async function saveNicheShop(owner:string,value:Shop,query:Query=runShopQuery){
 const {escrowHoldDays:_ignored,...shop}=validateShop(value);
 if(shop.payments?.TRON_USDT.enabled&&!validTronChecksum(shop.payments.TRON_USDT.wallet))throw new ShopError('INVALID_TRON_WALLET');
 if(!storePolicyReady(shop))throw new ShopError('STORE_POLICY_REQUIRED');
 if(!shop.shopId)throw new ShopError('SHOP_NOT_FOUND',404);
 const rows=await query(`UPDATE shops SET name=$3,logo=$4,catalog=$5::jsonb,affiliate_catalog=CASE WHEN shop_type='affiliate' THEN $5::jsonb END,personal_catalog=CASE WHEN shop_type='personal' THEN $5::jsonb END,niche_name=$6,affiliate_disclosure=CASE WHEN shop_type='affiliate' THEN coalesce($5::jsonb->>'affiliateDisclosure','') ELSE '' END,seller_usdc_wallet=CASE WHEN shop_type='personal' THEN coalesce($5::jsonb->>'cryptoWallet','') ELSE '' END,seller_email=CASE WHEN shop_type='personal' THEN coalesce($5::jsonb->>'sellerEmail','') ELSE '' END,cod_enabled=coalesce(($5::jsonb->>'codEnabled')::boolean,false),escrow_enabled=coalesce(($5::jsonb->>'escrowEnabled')::boolean,false),updated_at=now()
 WHERE id=$2::uuid AND owner_key=$1 AND store_mode='niche' AND deleted_at IS NULL AND shop_type=$7 AND seller_effective_plan($1)='pro' AND EXISTS(SELECT 1 FROM subscriptions WHERE owner_key=$1 AND status='active') RETURNING id,slug`,[owner,shop.shopId,shop.name,shop.logo||'',JSON.stringify(shop),shop.nicheName||'',shop.shopMode]);
 if(!rows[0])throw new ShopError('SHOP_NOT_FOUND',404);return rows[0];
}
