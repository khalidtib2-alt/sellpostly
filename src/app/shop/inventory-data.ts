export type StockVariant = {id:string; size:string; color:string; sku:string; stockCount:number};
export type InventoryEdit = {id:string; reason:'restock'|'adjustment'; note:string};
export type OrderItem = {id:string; quantity:number; variantId?:string};
export const stockReasons = ['initial','order','restock','return','adjustment'] as const;
export type StockReason = typeof stockReasons[number];
export const stockLimit = 1000000;

export function normalizeVariants(value:unknown):StockVariant[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>(), combinations = new Set<string>();
  const result:StockVariant[] = [];
  const clean = (input:unknown,max=80) => typeof input==='string' ? input.trim().slice(0,max) : '';
  for (const input of value.slice(0,100)) {
    if (!input || typeof input!=='object') continue;
    const id = clean(input.id), size = clean(input.size), color = clean(input.color), sku = clean(input.sku);
    const combination = JSON.stringify([size.normalize('NFKC').toLowerCase(),color.normalize('NFKC').toLowerCase()]);
    if (!/^[\w-]{1,80}$/.test(id) || (!size&&!color) || ids.has(id)||combinations.has(combination)) continue;
    if (!Number.isInteger(input.stockCount)||input.stockCount<0||input.stockCount>stockLimit) continue;
    ids.add(id);
    combinations.add(combination);
    result.push({id,size,color,sku,stockCount:input.stockCount});
  }
  return result;
}

export function normalizeInventoryEdit(value:unknown):InventoryEdit|undefined {
  if (!value || typeof value!=='object') return;
  const edit=value as Partial<InventoryEdit>;
  if (typeof edit.id!=='string'||!/^[\w-]{1,80}$/.test(edit.id)||!['restock','adjustment'].includes(edit.reason||'')) return;
  return {id:edit.id,reason:edit.reason!,note:typeof edit.note==='string'?edit.note.trim().slice(0,500):''};
}

export const variantLabel = (variant?:StockVariant) => variant ? [variant.size,variant.color].filter(Boolean).join(' / ') : '';
