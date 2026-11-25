const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/db/schema.sql',s=>s.replace('-- Multi-shop: the existing general record',`-- statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_account_links (
 pro_owner text PRIMARY KEY REFERENCES subscriptions(owner_key),
 account_owner text NOT NULL UNIQUE REFERENCES subscriptions(owner_key),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(pro_owner<>account_owner)
);
-- Multi-shop: the existing general record`).replace("IF subscription_provider='free' THEN RAISE EXCEPTION 'PRO_REQUIRED'; END IF;", "IF subscription_provider='free' AND NOT EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions p ON p.owner_key=l.pro_owner WHERE l.account_owner=NEW.owner_key AND p.status='active' AND (p.expires_at IS NULL OR p.expires_at>now())) THEN RAISE EXCEPTION 'PRO_REQUIRED'; END IF;"));
edit('src/lib/pro-auth.ts',s=>s.replace('return await ensureActiveSubscription(identity)?identity:null;',`if(!await ensureActiveSubscription(identity))return null;
 const {db}=await import('./db');const linked=await db().query("SELECT l.account_owner FROM shop_account_links l JOIN subscriptions s ON s.owner_key=l.account_owner WHERE l.pro_owner=$1 AND s.status='active'",[identity.ownerKey]);
 return linked[0]?{...identity,ownerKey:linked[0].account_owner}:identity;`));
edit('src/lib/shop-auth.ts',s=>s.replace("const pro=await proIdentity(request);if(pro)return {...pro,tier:'pro' as const};",`let pro=await proIdentity(request);
 if(pro){const token=request.headers.get('x-shop-key')||'';
 if(/^[0-9a-f]{64}$/.test(token)&&freeOwner(token)!==pro.ownerKey){const owner=freeOwner(token);const rows=await db().query(\x60INSERT INTO shop_account_links(pro_owner,account_owner) SELECT $1,$2 FROM subscriptions WHERE owner_key=$2 AND provider='free' AND status='active' AND NOT EXISTS(SELECT 1 FROM shops WHERE owner_key=$1) AND NOT EXISTS(SELECT 1 FROM shop_account_links WHERE pro_owner=$1 OR account_owner=$2) ON CONFLICT DO NOTHING RETURNING account_owner\x60,[pro.ownerKey,owner]);if(rows[0])pro={...pro,ownerKey:owner};}
 return {...pro,tier:'pro' as const};}`));
edit('src/lib/db.ts',s=>s.replace(/SET provider=excluded.provider,verified_at=now\(\)/g,"SET provider=CASE WHEN subscriptions.provider='free' THEN subscriptions.provider ELSE excluded.provider END,verified_at=now()"));
edit('src/lib/multi-shop-service.ts',s=>s.replace("provider<>'free' AND status='active'", "(provider<>'free' OR EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions p ON p.owner_key=l.pro_owner WHERE l.account_owner=$1 AND p.status='active' AND (p.expires_at IS NULL OR p.expires_at>now()))) AND status='active'"));
