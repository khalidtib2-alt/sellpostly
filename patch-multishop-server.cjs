const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/shop/shop-data.ts',s=>s.replace('export type Shop = {','export type Shop = { shopId?:string; customSlug?:string; storeMode?:"general"|"niche"; nicheName?:string;').replace('return {payments:raw.shopMode',`return {shopId:typeof raw.shopId==='string'&&/^[0-9a-f-]{36}$/i.test(raw.shopId)?raw.shopId:undefined,customSlug:typeof raw.customSlug==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(raw.customSlug)?raw.customSlug:undefined,storeMode:raw.storeMode==='niche'?'niche':'general',nicheName:text(raw.nicheName,100),payments:raw.shopMode`));
edit('src/db/schema.sql',s=>s.replace("('master','gumroad','development','crypto')","('master','gumroad','development','crypto','free')")+`
-- Multi-shop: the existing general record retains both primary catalogs and its slug.
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS store_mode text NOT NULL DEFAULT 'general' CHECK (store_mode IN ('general','niche'));
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_type text CHECK (shop_type IN ('affiliate','personal'));
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS niche_name text NOT NULL DEFAULT '';
-- statement-breakpoint
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_owner_key_key;
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shops_primary_owner ON shops(owner_key) WHERE store_mode='general';
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS shops_owner_list ON shops(owner_key,created_at);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_shop_limit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE subscription_provider text; subscription_status text; subscription_expiry timestamptz;
BEGIN
 SELECT provider,status,expires_at INTO subscription_provider,subscription_status,subscription_expiry FROM subscriptions WHERE owner_key=NEW.owner_key FOR UPDATE;
 IF NOT FOUND OR subscription_status<>'active' OR (subscription_expiry IS NOT NULL AND subscription_expiry<=now()) THEN RAISE EXCEPTION 'ACTIVE_ACCOUNT_REQUIRED'; END IF;
 IF TG_OP='UPDATE' AND (NEW.owner_key<>OLD.owner_key OR NEW.store_mode<>OLD.store_mode OR NEW.shop_type IS DISTINCT FROM OLD.shop_type) THEN RAISE EXCEPTION 'SHOP_IDENTITY_IMMUTABLE'; END IF;
 IF NEW.store_mode='niche' THEN
  IF NEW.shop_type IS NULL OR length(trim(NEW.niche_name))=0 THEN RAISE EXCEPTION 'NICHE_REQUIRED'; END IF;
  IF TG_OP='INSERT' THEN
   IF subscription_provider='free' THEN RAISE EXCEPTION 'PRO_REQUIRED'; END IF;
   IF (SELECT count(*) FROM shops WHERE owner_key=NEW.owner_key AND store_mode='niche')>=10 THEN RAISE EXCEPTION 'NICHE_LIMIT_REACHED'; END IF;
  END IF;
  IF NEW.shop_type='personal' THEN NEW.affiliate_catalog:=NULL; ELSE NEW.personal_catalog:=NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS shops_plan_limit ON shops;
-- statement-breakpoint
CREATE TRIGGER shops_plan_limit BEFORE INSERT OR UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION enforce_shop_limit();
`);
edit('src/lib/db.ts',s=>s.replace('ON CONFLICT(owner_key) DO UPDATE SET name=excluded.name','ON CONFLICT(owner_key) WHERE store_mode=\'general\' DO UPDATE SET name=excluded.name').replace(' FROM subscriptions WHERE owner_key=$1 AND status='," FROM subscriptions WHERE owner_key=$1 AND status=")
.replace("  const sql=db();\n  const slug='store-'",`  if(shop.storeMode==='niche'){
    const {saveNicheShop}=await import('./multi-shop-service');
    const saved=await saveNicheShop(identity.ownerKey,shop);return saved.slug;
  }
  const sql=db();
  const slug='store-'`)
.replace('SELECT affiliate_disclosure,catalog,affiliate_catalog','SELECT id,slug,store_mode,shop_type,niche_name,affiliate_disclosure,catalog,affiliate_catalog')
.replace('const row=rows[0];if(!row)return null;',"const row=rows[0];if(!row||(row.store_mode==='niche'&&mode&&mode!==row.shop_type))return null;")
.replace('return {...shop,...(shop.shopMode',"return {...shop,shopId:row.id,customSlug:row.slug,storeMode:row.store_mode==='niche'?'niche':'general',nicheName:row.niche_name||'',...(shop.shopMode")
.replace('WHERE owner_key=$1\",[owner]);return rows[0]',"WHERE owner_key=$1 AND store_mode='general'\",[owner]);return rows[0]"));
edit('scripts/init-db.mjs',s=>s.replace("['shops','affiliate_disclosure']","['shops','store_mode'],['shops','shop_type'],['shops','niche_name'],['shops','affiliate_disclosure']").replace('Phase 2 catalog/payment columns verified.','Multi-shop and catalog/payment columns verified.'));
