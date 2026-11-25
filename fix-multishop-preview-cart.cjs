const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/shop/use-shop-cart.ts',s=>s.replace(' const key=cartStorageKey(slug,snapshot),legacy=legacyCartStorageKey(slug,snapshot);'," const cartSlug=slug||(!snapshot&&shop.storeMode==='niche'?shop.customSlug||shop.shopId:undefined);\n const key=cartStorageKey(cartSlug,snapshot),legacy=legacyCartStorageKey(cartSlug,snapshot);"));
edit('src/app/shop/shop-builder.tsx',s=>s.replace('useShopCart(shop,publicSlug||shop.customSlug,snapshot,','useShopCart(shop,publicSlug,snapshot,'));
edit('src/app/shop/product-landing.tsx',s=>s.replace("import {useShopCart}","import {shopHeaders} from './multi-shop-data';\nimport {useShopCart}")
.replace("'?mode=personal'", "shop.storeMode==='niche'?'':'?mode=personal'")
.replace("headers:{'Content-Type':'application/json','x-pro-key':localStorage.getItem('sellpostly-pro-key')||''}","headers:{'Content-Type':'application/json',...shopHeaders(localStorage)}"));
