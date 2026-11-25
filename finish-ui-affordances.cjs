const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/shop/main-store-link.tsx',s=>s.replace("import {storePath} from './product-links';", "import {mainStoreHref} from './main-store-link-data';").replace(/export function mainStoreHref[^\n]+\n/,''));
edit('tests/main-store-ui.test.ts',s=>s.replace("from '../src/app/shop/main-store-link'","from '../src/app/shop/main-store-link-data'"));
edit('src/app/shop/shop-builder.tsx',s=>s.replace('<button className={button} onClick={()=>setPreview(false)}>', '<button aria-pressed={!preview} className={button} onClick={()=>setPreview(false)}>')
.replace('<button className={button} onClick={()=>{setPreview(true);setAdding(false);}}>', '<button aria-pressed={preview} className={button} onClick={()=>{setPreview(true);setAdding(false);}}>')
.replace('<article key={p.id} onClick=', '<article key={p.id} data-clickable={shop.shopMode===\'personal\'?\'true\':undefined} onClick='));
