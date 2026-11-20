import type {Shop} from './shop-data';
import {storePath} from './product-links';
/** Public destinations are supplied by the server's same-owner primary-store lookup. */
export function mainStoreHref(shop:Shop){return shop.storeMode==='niche'&&shop.showMainStoreLink!==false&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(shop.mainStoreSlug||'')?storePath(shop.mainStoreSlug!,shop.shopMode):null;}
