const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/lib/pro-auth.ts',s=>s.replace("'development' | 'crypto'", "'development' | 'crypto' | 'free'").replace('export async function proIdentity(request: Request){','export async function licensedIdentity(request: Request){')+`
export async function proIdentity(request:Request):Promise<ProIdentity|null>{
 if(!process.env.DATABASE_URL)return licensedIdentity(request);
 try{const {shopIdentity}=await import('./shop-auth');const identity=await shopIdentity(request);return identity?.tier==='pro'?identity:null;}catch{return null;}
}
`);
edit('src/lib/shop-auth.ts',s=>s.replace("import {proIdentity}","import {licensedIdentity}").replace('let pro=await proIdentity(request);','let pro=await licensedIdentity(request);').replace("import {db} from './db';","import {db} from './db';\nimport {sellerPlan} from './seller-plan';")
.replace("return {...pro,tier:'pro' as const};", "return {...pro,tier:process.env.DATABASE_URL?await sellerPlan(pro.ownerKey):'pro' as const};")
.replace("provider:'free' as const,tier:'free' as const", "provider:'free' as const,tier:await sellerPlan(rows[0].owner_key)"));
edit('src/lib/subscription-access.ts',s=>s.replace("SELECT owner_key FROM subscriptions WHERE owner_key=$1 AND provider='crypto' AND status='active' AND (expires_at IS NULL OR expires_at>now())", "SELECT owner_key FROM subscriptions WHERE owner_key=$1 AND provider='crypto' AND status='active' AND (expires_at IS NULL OR expires_at>now() OR plan_override IS NOT NULL OR EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions a ON a.owner_key=l.account_owner WHERE l.pro_owner=$1 AND a.plan_override IS NOT NULL AND a.status='active'))"));
edit('src/lib/multi-shop-service.ts',s=>s.replace("(provider<>'free' OR EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions p ON p.owner_key=l.pro_owner WHERE l.account_owner=$1 AND p.provider<>'free' AND p.status='active' AND (p.expires_at IS NULL OR p.expires_at>now())))", "seller_effective_plan($1)='pro'")
.replace("AND store_mode='niche' AND shop_type=$7 AND EXISTS", "AND store_mode='niche' AND shop_type=$7 AND seller_effective_plan($1)='pro' AND EXISTS"));
edit('src/lib/db.ts',s=>s.replace("FROM shops WHERE slug=$1 AND published=true LIMIT 1", "FROM shops WHERE slug=$1 AND published=true AND (store_mode='general' OR seller_effective_plan(owner_key)='pro') LIMIT 1"));
for(const p of ['src/lib/order-service.ts','src/lib/peer-order-service.ts','src/lib/cod-service.ts'])edit(p,s=>s.replace('FROM shops WHERE slug=$1 AND published=true',"FROM shops WHERE slug=$1 AND published=true AND (store_mode='general' OR seller_effective_plan(owner_key)='pro')"));
edit('src/lib/public-storefront.ts',s=>s.replace('WHERE published=true AND suspended=false ORDER BY slug', "WHERE published=true AND suspended=false AND (store_mode='general' OR seller_effective_plan(owner_key)='pro') ORDER BY slug"));
edit('src/app/shop/pro-gate.tsx',s=>s.replace("headers:{'x-pro-key':saved}","headers:{'x-pro-key':saved,'x-shop-key':localStorage.getItem('sellpostly-free-shop-key')||''}")
.replace('if(active)setVerified(response.ok);','if(active)setVerified(response.ok);if(!response.ok&&!children){const shop=await fetch(\'/api/shops\',{headers:{\'x-pro-key\':saved,\'x-shop-key\':localStorage.getItem(\'sellpostly-free-shop-key\')||\'\'},cache:\'no-store\'});if(active&&shop.ok)setFree(true);}')
.replace("if(active&&r.ok)setFree(true);", "if(active&&r.ok){const account=await r.json();if(account.tier==='pro')setVerified(true);else setFree(true);}"));
edit('src/app/dashboard/seller-dashboard.tsx',s=>s.replace("import WhatsAppQuickReplies", "import {shopHeaders} from '../shop/multi-shop-data';\nimport WhatsAppQuickReplies").replace("headers:{'Content-Type':'application/json','x-pro-key':key}","headers:{'Content-Type':'application/json',...shopHeaders(localStorage)}"));
// A single warning/policy panel before the direct form, not duplicated per field.
edit('src/app/shop/peer-checkout.tsx',s=>s.replace('<StorePolicy shop={shop}/><BuyerSafety/><label className="block">', '<label className="block">'));
