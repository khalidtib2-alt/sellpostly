import 'server-only';
import {randomUUID} from 'node:crypto';
import {catalogAdditions} from './external-catalog-products';
import {runShopQuery, ShopError} from './multi-shop-service';
import {validateShop, type ShopMode} from '../app/shop/shop-data';
import type {NormalizedCatalogItem} from './external-catalog-data';

export async function ensurePrimaryCatalogShop(owner: string, name: string, query = runShopQuery) {
  const rows = await query(`INSERT INTO shops(owner_key,slug,name,store_mode,published)
    SELECT $1,$2,$3,'general',false FROM subscriptions WHERE owner_key=$1 AND status='active'
    ON CONFLICT(owner_key) WHERE store_mode='general' DO NOTHING RETURNING id`,
  [owner,'store-'+randomUUID(),name.slice(0,100)]);
  const row = rows[0] || (await query("SELECT id FROM shops WHERE owner_key=$1 AND store_mode='general' AND deleted_at IS NULL",[owner]))[0];
  if (!row) throw new ShopError('SHOP_NOT_FOUND',404);
  return String(row.id);
}

export async function commitExternalCatalog(
  owner: string, id: string, items: NormalizedCatalogItem[], mode?: ShopMode,
  skipDuplicates = true, query = runShopQuery,
) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) throw new ShopError('SHOP_NOT_FOUND',404);
  for (let attempt=0;attempt<4;attempt++) {
    const [row] = await query(`SELECT id,slug,name,store_mode,shop_type,niche_name,catalog,affiliate_catalog,personal_catalog
      FROM shops WHERE id=$1::uuid AND owner_key=$2 AND deleted_at IS NULL`,[id,owner]);
    if (!row || (row.store_mode === 'niche' && mode && mode !== row.shop_type)) throw new ShopError('SHOP_NOT_FOUND',404);
    const activeMode = row.catalog?.shopMode === 'personal' ? 'personal' : 'affiliate';
    const targetMode: ShopMode = row.store_mode === 'niche' ? row.shop_type : mode || activeMode;
    const column = targetMode === 'personal' ? 'personal_catalog' : 'affiliate_catalog';
    const saved = row[column] ?? (targetMode === activeMode ? row.catalog : null);
    const catalog = {...saved, shopMode:targetMode, name:saved?.name || row.name,
      storeMode:row.store_mode, nicheName:row.niche_name, shopId:row.id, customSlug:row.slug,
      products:Array.isArray(saved?.products) ? saved.products : []};
    const existing = validateShop(catalog);
    const result = catalogAdditions(existing.products,items,targetMode,skipDuplicates);
    const products = validateShop({...existing,products:result.products}).products;
    if (!products.length) return {...result,products,shopId:id};
    const next = {...catalog,products:[...catalog.products,...products]};
    const updated = await query(`UPDATE shops SET ${column}=$3::jsonb,
      catalog=CASE WHEN coalesce(catalog->>'shopMode','affiliate')=$6 OR catalog='{}'::jsonb THEN $3::jsonb ELSE catalog END,
      updated_at=now() WHERE id=$1::uuid AND owner_key=$2 AND deleted_at IS NULL
      AND ${column} IS NOT DISTINCT FROM $4::jsonb AND catalog IS NOT DISTINCT FROM $5::jsonb RETURNING ${column} AS saved_catalog`,
    [id,owner,JSON.stringify(next),row[column] == null ? null : JSON.stringify(row[column]),JSON.stringify(row.catalog),targetMode]);
    if (updated.length) {
      const importedIds = new Set(products.map(product => product.id));
      const saved = validateShop(updated[0].saved_catalog).products.filter(product => importedIds.has(product.id));
      return {...result,products:saved,shopId:id};
    }
  }
  throw new ShopError('IMPORT_CONFLICT',409);
}
