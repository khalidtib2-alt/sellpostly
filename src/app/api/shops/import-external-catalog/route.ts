import {shopIdentity} from '../../../../lib/shop-auth';
import {shopFailure} from '../../../../lib/shop-mutations';
import {catalogSummary, discoverCatalog, normalizeStoreUrl} from '../../../../lib/external-catalog-discovery';
import {mapCatalogCsv, parseCatalogCsv} from '../../../../lib/external-catalog-csv';
import {commitExternalCatalog, ensurePrimaryCatalogShop} from '../../../../lib/external-catalog-service';
import {selectedCatalogItems} from '../../../../lib/external-catalog-products';
import {field, record} from '../../../../lib/external-catalog-data';

export const runtime = 'nodejs';
export const maxDuration = 30;
const headers = {'Cache-Control':'no-store'};
const fail = (error: string, status = 400) => Response.json({error},{status,headers});

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return fail('INVALID_ORIGIN',403);
    const identity = await shopIdentity(request);
    if (!identity) return fail('AUTH_REQUIRED',401);
    const limit = 2_000_000;
    if (Number(request.headers.get('content-length')) > limit) return fail('CATALOG_TOO_LARGE',413);
    const reader = request.body?.getReader();
    if (!reader) return fail('INVALID_ITEMS');
    const decoder = new TextDecoder();
    let size = 0, body = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) { await reader.cancel(); return fail('CATALOG_TOO_LARGE',413); }
      body += decoder.decode(chunk.value,{stream:true});
    }
    let value;
    try { value = record(JSON.parse(body+decoder.decode())); } catch { return fail('INVALID_ITEMS'); }
    if (value.action === 'preview') {
      if (value.csvRows !== undefined || value.rows !== undefined || value.csv !== undefined) {
        try {
          const rows = value.csv !== undefined ? parseCatalogCsv(field(value.csv,limit)) : value.csvRows ?? value.rows;
          const base = value.storeUrl ? normalizeStoreUrl(value.storeUrl).href : undefined;
          if (!Array.isArray(rows)) return fail('INVALID_CSV');
          return Response.json({platformDetected:'CSV',products:mapCatalogCsv(rows,catalogSummary,base)},{headers});
        } catch (error) {
          return error instanceof Error && error.message === 'CATALOG_TOO_LARGE' ? fail('CATALOG_TOO_LARGE',413) : fail('INVALID_CSV');
        }
      }
      let url;
      try { url = normalizeStoreUrl(value.storeUrl); } catch { return fail('INVALID_STORE_URL'); }
      return Response.json(await discoverCatalog(url),{headers});
    }
    if (value.action === 'commit') {
      let items;
      try { items = selectedCatalogItems(value.items); } catch { return fail('INVALID_ITEMS'); }
      const mode = value.storeMode === 'affiliate' || value.storeMode === 'personal' ? value.storeMode : undefined;
      const id = field(value.targetShopId,100) || (value.createPrimary === true && mode
        ? await ensurePrimaryCatalogShop(identity.ownerKey,field(value.shopName,100)) : '');
      return Response.json(await commitExternalCatalog(identity.ownerKey,id,items,mode,value.skipDuplicates !== false),{headers});
    }
    return fail('INVALID_ITEMS');
  } catch (error) { return shopFailure(error); }
}
