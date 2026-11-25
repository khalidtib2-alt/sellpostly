const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/lib/db.ts',s=>s.replace(' AND coalesce(p.published,true)',''));
edit('src/app/shop/multi-shop-data.ts',s=>s.replace('escrowHoldDays:target.escrowHoldDays','escrowHoldDays:target.escrowHoldDays,mainStoreSlug:target.mainStoreSlug'));
edit('src/app/shop/shop-builder.tsx',s=>s.replace('import MultiShopSwitcher',"import MainStoreLink from './main-store-link';\nimport MultiShopSwitcher")
.replace('escrowHoldDays:target.escrowHoldDays','escrowHoldDays:target.escrowHoldDays,mainStoreSlug:target.mainStoreSlug')
.replace('setShop(previous=>({...previous,escrowHoldDays:days}));','setShop(previous=>({...previous,escrowHoldDays:days,mainStoreSlug:assigned?.mainStoreSlug}));')
.replace("  async function shareMode(",`  async function saveStoreSettings(){
    if(publishing)return;setPublishing(true);setStatus('');
    try{const current=shopRef.current;const response=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify(current)});if(!response.ok)throw Error();const result=await response.json();setPublishedSlug(result.slug);setStatus('Store settings saved.');}
    catch{setStatus('Could not save store settings. Try again.');}finally{setPublishing(false);}
  }
  async function shareMode(`)
.replace("{(shared||preview)&&loaded&&<StorefrontHero shop={shop} verified={verifiedStore}/>}" ,"{(shared||preview)&&loaded&&<><StorefrontHero shop={shop} verified={verifiedStore}/><MainStoreLink shop={shop}/></>}")
.replace("      {shop.storeMode==='niche'&&<label>{t('Niche Name')}",`      {shop.storeMode==='niche'&&<fieldset className="rounded-xl border bg-white p-4 sm:col-span-3"><label className="flex cursor-pointer items-center gap-3 font-semibold"><input type="checkbox" checked={shop.showMainStoreLink!==false} onChange={e=>setShop({...shop,showMainStoreLink:e.target.checked})}/>{t('Show link to my main store')}</label><p className="mt-2 text-sm text-slate-600">{t(shop.mainStoreSlug?'Visitors can browse all categories in your matching primary store.':'The link appears after your matching primary store is published.')}</p><button type="button" aria-busy={publishing} disabled={publishing} className={button+" mt-4"} onClick={()=>void saveStoreSettings()}>{status==='Store settings saved.'&&!publishing&&<span aria-hidden="true">✓ </span>}{t(publishing?'Saving…':'Save Store Settings')}</button></fieldset>}
      {shop.storeMode==='niche'&&<label>{t('Niche Name')}`));
edit('src/app/shop/storefront-templates.tsx',s=>s.replace("[demo,setDemo]=useState('');", "[demo,setDemo]=useState(''),[added,setAdded]=useState('');\n const addedTimer=useRef<ReturnType<typeof setTimeout>|null>(null);useEffect(()=>()=>{if(addedTimer.current)clearTimeout(addedTimer.current);},[]);\n function addProduct(p:Product,quantity:number){onAdd(p,quantity);setAdded(p.id);if(addedTimer.current)clearTimeout(addedTimer.current);addedTimer.current=setTimeout(()=>setAdded(''),1800);}")
.replace('onClick={()=>onAdd(p,1)}><ShoppingBag size={16}/>{t(\'Add to Cart\')}',"onClick={()=>addProduct(p,1)} aria-live=\"polite\" data-state={added===p.id?'saved':undefined}>{added===p.id?<Check size={16}/>:<ShoppingBag size={16}/>} {t(added===p.id?'Added to Cart':'Add to Cart')}"));
