const fs=require('fs');const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let p='src/app/shop/catalog-modes.ts',s=read(p);s=s.replace('const products=saved?validateShop(JSON.parse(saved)).products:[];', 'const archived=saved?validateShop(JSON.parse(saved)):null;\n const products=archived?.products||[];');s=s.replace('validateShop({...shop,shopMode:mode,products})','validateShop({...shop,...archived,shopMode:mode,products})');write(p,s);
p='src/app/shop/shop-builder.tsx';s=read(p);const old='try {const saved=localStorage.getItem(shopKey);if(saved)initial=upgradeDemoPhotos(validateShop(JSON.parse(saved)));}catch{}';
s=s.replace(old,`try {
            const saved=localStorage.getItem(shopKey);if(saved)initial=upgradeDemoPhotos(validateShop(JSON.parse(saved)));
            const response=await fetch('/api/shops',{headers:{'x-pro-key':localStorage.getItem('sellpostly-pro-key')||''},cache:'no-store'});
            if(response.ok){const settings=await response.json();if(settings.slug)setPublishedSlug(settings.slug);for(const mode of ['affiliate','personal'] as const){const catalog=settings[mode+'_catalog'];if(catalog&&!localStorage.getItem(modeCatalogKey(mode)))localStorage.setItem(modeCatalogKey(mode),JSON.stringify(validateShop(catalog)));}if(!saved){const mode=params.get('mode')==='personal'?'personal':settings.affiliate_catalog?'affiliate':'personal';const catalog=settings[mode+'_catalog'];if(catalog)initial=validateShop(catalog);}}
          }catch{}`);
write(p,s);
p='src/lib/admin-service.ts';s=read(p).replace('SELECT coin,network FROM orders UNION', "SELECT coin,network FROM orders WHERE payment_method='CRYPTO' UNION");write(p,s);
p='src/lib/notifications.ts';s=read(p);s=s.replace("...(kind==='delivered'?{tracking:", "...(kind.startsWith('cod_')?{notes:[...(details.items||[]).map((item:{name:string;quantity:number})=>item.name+' × '+item.quantity),details.buyer?.name,details.buyer?.contact,details.buyer?.phone,details.delivery_note].filter(Boolean).join('\\n')}:{}),...(kind==='delivered'?{tracking:");write(p,s);
p='scripts/init-db.mjs';s=read(p);s=s.replace("console.log('Database initialized successfully. Tables:');",`const columns=await sql.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('shops','orders')");
 for(const [table,column] of [['shops','affiliate_catalog'],['shops','personal_catalog'],['shops','seller_usdc_wallet'],['shops','cod_enabled'],['orders','payment_method'],['orders','escrow_status']])if(!columns.some(row=>row.table_name===table&&row.column_name===column))throw Error('MISSING_PHASE2_COLUMNS');
 console.log('Database initialized successfully. Phase 2 catalog/payment columns verified. Tables:');`);write(p,s);
