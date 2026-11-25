const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/shop/shop-builder.tsx',s=>s.replace("hidden={shop.storeMode==='niche'} className=", "hidden={shop.storeMode==='niche'} style={shop.storeMode==='niche'?{display:'none'}:undefined} className=")
.replace('      <label>{t("Bio")}',`      {shop.storeMode==='niche'&&<label>{t('Niche Name')}<input className={field} value={shop.nicheName||''} maxLength={100} onChange={e=>setShop({...shop,nicheName:e.target.value})}/></label>}
      <label>{t("Bio")}`)
.replace("    {!shared&&!", "    {!shared&&!")
.replace('    {!shared&&<p className="mb-4 text-sm text-slate-600">',`    {!shared&&loaded&&shop.storeMode==='niche'&&<section className="mb-6 rounded-2xl border bg-white p-5"><h2 className="font-bold">{shop.name}</h2><input aria-label={t('Copy Link')} readOnly dir="ltr" className={field} value={shop.customSlug?productShareUrl(storePath(shop.customSlug,shop.shopMode)):''}/><button type="button" className={button+" mt-3"} onClick={()=>void share()}>{t('Social Share')}</button></section>}
    {!shared&&<p className="mb-4 text-sm text-slate-600">`));
edit('src/lib/admin-service.ts',s=>s.replace("FROM subscriptions WHERE status='active' AND (expires_at IS NULL OR expires_at>now())) AS active_subscriptions", "FROM subscriptions WHERE provider<>'free' AND status='active' AND (expires_at IS NULL OR expires_at>now())) AS active_subscriptions"));
edit('src/app/api/shop/route.ts',s=>"export {GET,POST} from '../shops/route';\nexport const runtime='nodejs';\n");
edit('chrome-extension/popup.js',s=>s.replace('    language = next;','    language = next;').replace('  language = next;',"  language = next;\n  if(globalThis.sellpostlySyncedShops)renderSyncedShops(globalThis.sellpostlySyncedShops);").replace('function renderSyncedShops(list){syncedShopList=', 'function renderSyncedShops(list){globalThis.sellpostlySyncedShops=list;syncedShopList='));
