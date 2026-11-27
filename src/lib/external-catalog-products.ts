import {randomUUID} from 'node:crypto';
import {catalogLimit, normalizeCatalogItem, type NormalizedCatalogItem} from './external-catalog-data';
import {shopPrice} from './shop-handoff';
import type {Product, ShopMode} from '../app/shop/shop-data';

export function selectedCatalogItems(value: unknown): NormalizedCatalogItem[] {
  if (!Array.isArray(value) || !value.length || value.length > catalogLimit) throw Error('INVALID_ITEMS');
  return value.map(row => {
    const item = normalizeCatalogItem(row);
    if (!item) throw Error('INVALID_ITEMS');
    return item;
  });
}

const titleKey = (title: string) => title.normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase();
function urlKey(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|tag$|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.host.toLowerCase()+url.pathname.replace(/\/+$/,'')+url.search;
  } catch { return ''; }
}

export function catalogAdditions(existing: Product[], items: NormalizedCatalogItem[], mode: ShopMode, skipDuplicates = true) {
  const titles = new Set(existing.map(product => titleKey(product.name)));
  const urls = new Set(existing.flatMap(product => [urlKey(product.importSourceUrl || ''),urlKey(product.url)]).filter(Boolean));
  const products: Product[] = [];
  for (const item of items) {
    const title = titleKey(item.title);
    const url = urlKey(item.sourceUrl);
    if (skipDuplicates && (titles.has(title) || (url && urls.has(url)))) continue;
    titles.add(title);
    if (url) urls.add(url);
    products.push({
      id:randomUUID(), createdAt:new Date().toISOString(), catalogMode:mode, name:item.title,
      description:item.description, price:shopPrice(item.price,item.currency),
      compareAtPrice:shopPrice(item.compareAtPrice,item.currency), category:item.category || 'Other',
      image:item.images[0] || '', images:item.images, gender:'unisex', source:'Other',
      url: mode === 'affiliate' ? item.sourceUrl : '', importSourceUrl:item.sourceUrl,
      variantOptions:mode === 'personal' ? item.options : undefined,
      stock:mode === 'personal' ? item.stock : undefined,
    });
  }
  return {products, importedCount:products.length, skippedCount:items.length-products.length};
}
