const fs=require('fs');const p='src/app/shop/shop-builder.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace('import {cardShareUrl}',`import MultiShopSwitcher from './multi-shop-switcher';
import {shopListKey,activeShopKey,shopSelection,readShopList,persistShop,switchShop,shopDraftKey,shopHeaders} from './multi-shop-data';
import {cardShareUrl}`);
s=s.replace('  const [publishedSlug',`  const [shops,setShops]=useState<Shop[]>([]),[tier,setTier]=useState<'free'|'pro'>('free');
  const [publishedSlug`);
s=s.replace('useShopCart(shop,publicSlug,snapshot,','useShopCart(shop,publicSlug||shop.customSlug,snapshot,');
s=s.replace("headers:{'x-pro-key':localStorage.getItem('sellpostly-pro-key')||''}","headers:shopHeaders(localStorage)");
const old="if(response.ok){const settings=await response.json();if(settings.slug)setPublishedSlug(settings.slug);for(const mode of ['affiliate','personal'] as const){const catalog=settings[mode+'_catalog'];if(catalog&&!localStorage.getItem(modeCatalogKey(mode)))localStorage.setItem(modeCatalogKey(mode),JSON.stringify(validateShop(catalog)));}if(!saved){const mode=params.get('mode')==='personal'?'personal':settings.affiliate_catalog?'affiliate':'personal';const catalog=settings[mode+'_catalog'];if(catalog)initial=validateShop(catalog);}}";
const replacement=`if(response.ok){const settings=await response.json();setTier(settings.tier==='pro'?'pro':'free');
 const server:Shop[]=Array.isArray(settings.shops)?settings.shops.map(validateShop):[];
 for(const mode of ['affiliate','personal'] as const){if(!server.some(s=>s.storeMode!=='niche'&&s.shopMode===mode)){const catalog=settings[mode+'_catalog'];const draft=localStorage.getItem(modeCatalogKey(mode));server.push(validateShop(catalog|| (draft?JSON.parse(draft):{name:initial.name,bio:'',products:[],shopMode:mode})));}}
 const list=server.map(target=>{const draft=localStorage.getItem(shopDraftKey(target));return draft?validateShop({...JSON.parse(draft),shopId:target.shopId,customSlug:target.customSlug,storeMode:target.storeMode,shopMode:target.shopMode,escrowHoldDays:target.escrowHoldDays}):target;});
 localStorage.setItem(shopListKey,JSON.stringify(list));setShops(list);
 const active=params.get('mode')?list.find(s=>s.storeMode!=='niche'&&s.shopMode===params.get('mode')):list.find(s=>shopSelection(s)===(localStorage.getItem(activeShopKey)||shopSelection(initial)));
 if(active)initial=active;else if(!saved&&list[0])initial=list[0];
 if(initial.customSlug||settings.slug)setPublishedSlug(initial.customSlug||settings.slug);
 }`;
if(!s.includes(old))throw Error('load anchor');s=s.replace(old,replacement);
s=s.replace('localStorage.setItem(modeCatalogKey(shop.shopMode),JSON.stringify(shop));',"persistShop(shop,localStorage);setShops(readShopList(localStorage));");
s=s.replace('headers:{"x-pro-key":key}', 'headers:shopHeaders(localStorage)');
s=s.replace('if(active){if(settings.slug)setPublishedSlug(settings.slug);const days=holdDays(settings.escrow_hold_days);',"if(active){const current=shopRef.current;const assigned=(settings.shops||[]).find((s:Shop)=>shopSelection(s)===shopSelection(current));if(assigned?.customSlug||current.customSlug||settings.slug)setPublishedSlug(assigned?.customSlug||current.customSlug||settings.slug);const days=holdDays(assigned?.escrowHoldDays??settings.escrow_hold_days);");
s=s.replace('},[shared,loaded]);','},[shared,loaded,shop.shopId,shop.shopMode]);');
s=s.replace('result.shop.shopMode!==shopRef.current.shopMode', 'shopSelection(result.shop)!==shopSelection(shopRef.current)');
s=s.replace("setFilter(result.category||'All');setGenderFilter", "setPublishedSlug(result.shop.customSlug||'');setFilter(result.category||'All');setGenderFilter");
s=s.replace('const headers={\'Content-Type\':\'application/json\',\'x-pro-key\':localStorage.getItem(\'sellpostly-pro-key\')||\'\'};',"const headers={'Content-Type':'application/json',...shopHeaders(localStorage)};");
s=s.replace('  function createPost(product:Product){',`  function primaryShop(mode:'affiliate'|'personal'){return readShopList(localStorage).find(s=>s.storeMode!=='niche'&&s.shopMode===mode)||validateShop({name:'',bio:'',shopMode:mode,products:[]});}
  function activateShop(target:Shop){try{const next=switchShop(shopRef.current,target,localStorage);shopRef.current=next;setShop(next);setPublishedSlug(next.customSlug||'');setAssignedHold(holdDays(next.escrowHoldDays));setFilter('All');setGenderFilter('all');setSearch('');setAdding(false);setEditing(null);setCartOpen(false);setCheckout(null);setCodLines(null);setPaymentMessage('');setStatus('');}catch{setStatus('Could not save. Device storage may be full.');}}
  async function createNiche(value:Record<string,string>){const r=await fetch('/api/shops',{method:'POST',headers:{'Content-Type':'application/json',...shopHeaders(localStorage)},body:JSON.stringify({action:'createNiche',shop:value})});const result=await r.json();if(!r.ok)throw Error(result.error);const next=validateShop(result.shop);const list=[...readShopList(localStorage),next];localStorage.setItem(shopListKey,JSON.stringify(list));setShops(list);activateShop(next);setPreview(false);}
  function createPost(product:Product){`);
s=s.replace('setShop(switchCatalog(shop,mode,localStorage));','activateShop(primaryShop(mode));');
s=s.replace('const matches=shop.products.filter(p=>(filter===',"const matches=shop.products.filter(p=>(shop.storeMode==='niche'||filter===");
s=s.replace('    {!shared&&loaded&&<div className="mb-6 flex flex-wrap gap-3"', '    {!shared&&loaded&&<MultiShopSwitcher shops={shops} active={shop} tier={tier} onSelect={activateShop} onCreate={createNiche}/> }\n    {!shared&&loaded&&shop.storeMode!==\'niche\'&&<div className="mb-6 flex flex-wrap gap-3"');
s=s.replace('    {!shared&&loaded&&<section className="mb-6 grid gap-4 md:grid-cols-2">','    {!shared&&loaded&&shop.storeMode!==\'niche\'&&<section className="mb-6 grid gap-4 md:grid-cols-2">');
s=s.replace('<fieldset className="sm:col-span-3"><legend className="mb-2 font-semibold">{t("Shop Type")}', '<fieldset disabled={shop.storeMode===\'niche\'} className="sm:col-span-3"><legend className="mb-2 font-semibold">{t("Shop Type")}');
s=s.replace('{(["Product Name","Price","Category","Image URL","Affiliate / Checkout URL"] as const).map((text,i)=><label', '{shop.storeMode===\'niche\'&&<input type="hidden" name="category" value={shop.nicheName||"Other"}/>}\n      {(["Product Name","Price","Category","Image URL","Affiliate / Checkout URL"] as const).map((text,i)=>shop.storeMode===\'niche\'&&i===2?null:<label');
// Categories are a standalone nav in the existing page.
s=s.replace('<div className="mb-4 flex flex-wrap gap-2">{options.map', '<div hidden={shop.storeMode===\'niche\'} className="mb-4 flex flex-wrap gap-2">{options.map');
fs.writeFileSync(p,s);
