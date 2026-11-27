export type CatalogOption = { name: string; values: string[] };
export type NormalizedCatalogItem = {
  title: string; description: string; price: string; compareAtPrice: string;
  currency: string; images: string[]; sourceUrl: string; category: string;
  stock?: number; options: CatalogOption[];
};
export type CatalogPlatform = 'Shopify' | 'WooCommerce' | 'YouCan' | 'Storeino' | 'Generic store' | 'CSV';

export const catalogLimit = 1000;
export const catalogImageLimit = 250;
export const field = (value: unknown, limit = 2048) =>
  (typeof value === 'string' || typeof value === 'number') ? String(value).trim().slice(0, limit) : '';
export const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function catalogUrl(value: unknown, base?: string) {
  const input = field(value);
  if (!input) return '';
  try {
    const url = new URL(input, base);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function normalizeCatalogItem(value: unknown): NormalizedCatalogItem | null {
  const item = record(value);
  const title = field(item.title, 120);
  if (!title) return null;
  const stock = field(item.stock);
  return {
    title, description: field(item.description, 4000), price: field(item.price, 50),
    compareAtPrice: field(item.compareAtPrice, 50), currency: field(item.currency, 3).toUpperCase(),
    images: [...new Set(array(item.images).map(image => catalogUrl(image)).filter(Boolean))].slice(0, catalogImageLimit),
    sourceUrl: catalogUrl(item.sourceUrl), category: field(item.category, 80),
    stock: /^\d+$/.test(stock) ? Math.min(Number(stock), 1000000) : undefined,
    options: array(item.options).slice(0, 20).flatMap(option => {
      const row = record(option);
      const name = field(row.name, 80);
      const values = [...new Set(array(row.values).map(value => field(value, 80)).filter(Boolean))].slice(0, 100);
      return name && values.length ? [{name, values}] : [];
    }),
  };
}
