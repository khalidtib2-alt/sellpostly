-- Each statement is separated by -- statement-breakpoint for atomic initialization.
CREATE TABLE IF NOT EXISTS subscriptions (
  owner_key text PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('master','gumroad','development')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key text NOT NULL UNIQUE REFERENCES subscriptions(owner_key),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  name text NOT NULL,
  logo text NOT NULL DEFAULT '',
  escrow_hold_days integer NOT NULL DEFAULT 7 CHECK (escrow_hold_days BETWEEN 3 AND 15),
  catalog jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(catalog) = 'object'),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  gross_amount numeric(20,6) NOT NULL CHECK (gross_amount > 0),
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.05 CHECK (commission_rate = 0.05),
  commission_amount numeric(20,6) GENERATED ALWAYS AS (round(gross_amount * commission_rate,6)) STORED,
  net_amount numeric(20,6) GENERATED ALWAYS AS (gross_amount - round(gross_amount * commission_rate,6)) STORED,
  coin text NOT NULL CHECK (coin IN ('USDC','USDT')),
  network text NOT NULL CHECK (network IN ('Polygon','Base','Arbitrum','BNB Smart Chain','Solana')),
  escrow_hold_days integer NOT NULL DEFAULT 7 CHECK (escrow_hold_days BETWEEN 3 AND 15),
  payment_verified_at timestamptz,
  escrow_release_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','held','released','disputed','refunded','cancelled')),
  tx_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('held','released','disputed') OR (tx_id IS NOT NULL AND payment_verified_at IS NOT NULL AND escrow_release_at IS NOT NULL)),
  CHECK (escrow_release_at IS NULL OR escrow_release_at >= payment_verified_at + make_interval(days => escrow_hold_days))
);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_network_tx_id ON orders(network,tx_id) WHERE tx_id IS NOT NULL;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS orders_shop_status ON orders(shop_id,status);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  amount numeric(20,6) NOT NULL CHECK (amount >= 10.00),
  coin text NOT NULL CHECK (coin IN ('USDC','USDT')),
  network text NOT NULL CHECK (network IN ('Polygon','Base','Arbitrum','BNB Smart Chain','Solana')),
  wallet text NOT NULL CHECK (length(wallet) BETWEEN 32 AND 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  tx_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS payout_requests_shop_status ON payout_requests(shop_id,status);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_order_hold() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT escrow_hold_days INTO NEW.escrow_hold_days FROM shops WHERE id = NEW.shop_id;
  ELSE
    IF NEW.shop_id <> OLD.shop_id THEN RAISE EXCEPTION 'Order shop cannot change'; END IF;
    NEW.escrow_hold_days := OLD.escrow_hold_days;
    IF OLD.payment_verified_at IS NOT NULL AND (NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at OR NEW.gross_amount <> OLD.gross_amount OR NEW.coin <> OLD.coin OR NEW.network <> OLD.network OR NEW.tx_id IS DISTINCT FROM OLD.tx_id) THEN
      RAISE EXCEPTION 'Verified payment cannot change';
    END IF;
  END IF;
  IF NEW.payment_verified_at IS NOT NULL THEN
    NEW.escrow_release_at := NEW.payment_verified_at + make_interval(days => NEW.escrow_hold_days);
  END IF;
  IF NEW.status = 'released' AND (NEW.escrow_release_at IS NULL OR NEW.escrow_release_at > now()) THEN
    RAISE EXCEPTION 'Escrow hold has not ended';
  END IF;
  RETURN NEW;
END $$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS orders_hold ON orders;
-- statement-breakpoint
CREATE TRIGGER orders_hold BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION enforce_order_hold();
-- statement-breakpoint
CREATE OR REPLACE FUNCTION request_seller_payout(p_shop uuid,p_owner text,p_amount numeric,p_coin text,p_network text,p_wallet text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE available numeric; reserved numeric; result uuid;
BEGIN
  IF p_amount < 10 THEN RAISE EXCEPTION 'Minimum payout is 10.00'; END IF;
  PERFORM 1 FROM subscriptions WHERE owner_key=p_owner AND status='active' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active subscription required'; END IF;
  PERFORM 1 FROM shops WHERE id=p_shop AND owner_key=p_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shop ownership required'; END IF;
  SELECT coalesce(sum(net_amount),0) INTO available FROM orders WHERE shop_id=p_shop AND status='released' AND escrow_release_at<=now() AND coin=p_coin AND network=p_network;
  SELECT coalesce(sum(amount),0) INTO reserved FROM payout_requests WHERE shop_id=p_shop AND status IN ('pending','approved','paid') AND coin=p_coin AND network=p_network;
  IF p_amount > available-reserved THEN RAISE EXCEPTION 'Insufficient released balance'; END IF;
  INSERT INTO payout_requests(shop_id,amount,coin,network,wallet) VALUES(p_shop,p_amount,p_coin,p_network,p_wallet) RETURNING id INTO result;
  RETURN result;
END $$;
-- statement-breakpoint
REVOKE ALL ON FUNCTION request_seller_payout(uuid,text,numeric,text,text,text) FROM PUBLIC;

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_normalized_network_tx ON orders(network,(CASE WHEN network='Solana' THEN tx_id ELSE lower(tx_id) END)) WHERE tx_id IS NOT NULL;

-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_order_hold() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE blocked boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT escrow_hold_days,suspended INTO NEW.escrow_hold_days,blocked FROM shops WHERE id=NEW.shop_id FOR SHARE;
    IF blocked THEN RAISE EXCEPTION 'Store suspended'; END IF;
  ELSE
    IF NEW.shop_id <> OLD.shop_id THEN RAISE EXCEPTION 'Order shop cannot change'; END IF;
    NEW.escrow_hold_days := OLD.escrow_hold_days;
    IF OLD.payment_verified_at IS NOT NULL AND (NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at OR NEW.gross_amount <> OLD.gross_amount OR NEW.coin <> OLD.coin OR NEW.network <> OLD.network OR NEW.tx_id IS DISTINCT FROM OLD.tx_id) THEN
      RAISE EXCEPTION 'Verified payment cannot change';
    END IF;
  END IF;
  IF NEW.payment_verified_at IS NOT NULL THEN
    NEW.escrow_release_at := NEW.payment_verified_at + make_interval(days => NEW.escrow_hold_days);
  END IF;
  IF NEW.status = 'released' AND (NEW.escrow_release_at IS NULL OR NEW.escrow_release_at > now()) THEN
    RAISE EXCEPTION 'Escrow hold has not ended';
  END IF;
  RETURN NEW;
END $$;

-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS force_released_at timestamptz;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_order_hold() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE blocked boolean; confirmed_at timestamptz;
BEGIN
 IF TG_OP='INSERT' THEN
  SELECT escrow_hold_days,suspended INTO NEW.escrow_hold_days,blocked FROM shops WHERE id=NEW.shop_id FOR SHARE;
  IF blocked THEN RAISE EXCEPTION 'Store suspended'; END IF;
  IF NEW.force_released_at IS NOT NULL THEN RAISE EXCEPTION 'Force release requires an existing buyer-confirmed order'; END IF;
 ELSE
  IF NEW.shop_id<>OLD.shop_id THEN RAISE EXCEPTION 'Order shop cannot change'; END IF;
  NEW.escrow_hold_days:=OLD.escrow_hold_days;
  IF OLD.payment_verified_at IS NOT NULL AND (NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at OR NEW.gross_amount<>OLD.gross_amount OR NEW.coin<>OLD.coin OR NEW.network<>OLD.network OR NEW.tx_id IS DISTINCT FROM OLD.tx_id) THEN RAISE EXCEPTION 'Verified payment cannot change'; END IF;
  IF NEW.force_released_at IS DISTINCT FROM OLD.force_released_at THEN
   IF OLD.force_released_at IS NOT NULL THEN RAISE EXCEPTION 'Force release audit cannot change'; END IF;
   BEGIN confirmed_at:=(OLD.details->>'buyer_confirmed_at')::timestamptz; EXCEPTION WHEN OTHERS THEN confirmed_at:=NULL; END;
   IF NEW.status<>'released' OR OLD.status NOT IN ('held','disputed') OR confirmed_at IS NULL OR OLD.payment_verified_at IS NULL OR confirmed_at<OLD.payment_verified_at OR confirmed_at>now() THEN RAISE EXCEPTION 'Buyer confirmation required for force release'; END IF;
   NEW.force_released_at:=now();
  END IF;
 END IF;
 IF NEW.payment_verified_at IS NOT NULL THEN NEW.escrow_release_at:=NEW.payment_verified_at+make_interval(days=>NEW.escrow_hold_days); END IF;
 IF NEW.status='released' AND (NEW.escrow_release_at IS NULL OR NEW.escrow_release_at>now()) AND NEW.force_released_at IS NULL THEN RAISE EXCEPTION 'Escrow hold has not ended'; END IF;
 RETURN NEW;
END $$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION request_seller_payout(p_shop uuid,p_owner text,p_amount numeric,p_coin text,p_network text,p_wallet text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE available numeric; reserved numeric; result uuid;
BEGIN
  IF p_amount < 10 THEN RAISE EXCEPTION 'Minimum payout is 10.00'; END IF;
  PERFORM 1 FROM subscriptions WHERE owner_key=p_owner AND status='active' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active subscription required'; END IF;
  PERFORM 1 FROM shops WHERE id=p_shop AND owner_key=p_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shop ownership required'; END IF;
  SELECT coalesce(sum(net_amount),0) INTO available FROM orders WHERE shop_id=p_shop AND status='released' AND (escrow_release_at<=now() OR force_released_at IS NOT NULL) AND coin=p_coin AND network=p_network;
  SELECT coalesce(sum(amount),0) INTO reserved FROM payout_requests WHERE shop_id=p_shop AND status IN ('pending','approved','paid') AND coin=p_coin AND network=p_network;
  IF p_amount > available-reserved THEN RAISE EXCEPTION 'Insufficient released balance'; END IF;
  INSERT INTO payout_requests(shop_id,amount,coin,network,wallet) VALUES(p_shop,p_amount,p_coin,p_network,p_wallet) RETURNING id INTO result;
  RETURN result;
END $$;

-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
-- statement-breakpoint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_provider_check;
-- statement-breakpoint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_provider_check CHECK (provider IN ('master','gumroad','development','crypto','free'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS pro_upgrade_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
 plan text NOT NULL CHECK (plan IN ('monthly','lifetime','b2b')),
 amount_usd numeric(12,2) NOT NULL CHECK (amount_usd>0),
 coin text NOT NULL CHECK (coin IN ('USDC','USDT')),
 network text NOT NULL DEFAULT 'Polygon' CHECK (network='Polygon'),
 tx_id text NOT NULL UNIQUE CHECK (tx_id ~ '^0x[0-9a-f]{64}$'),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 issued_license_key text UNIQUE,
 receipt_token_hash text NOT NULL CHECK (receipt_token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz,
 CHECK ((status='approved' AND issued_license_key IS NOT NULL AND approved_at IS NOT NULL) OR (status<>'approved' AND issued_license_key IS NULL))
);

-- statement-breakpoint
ALTER TABLE pro_upgrade_requests DROP CONSTRAINT IF EXISTS pro_upgrade_requests_plan_check;
-- statement-breakpoint
ALTER TABLE pro_upgrade_requests ADD CONSTRAINT pro_upgrade_requests_plan_check CHECK (plan IN ('monthly','lifetime','b2b'));
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS email text;
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','es','ar'));
-- statement-breakpoint
ALTER TABLE pro_upgrade_requests ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','es','ar'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS transactional_email_deliveries(event_key text PRIMARY KEY,sent_at timestamptz NOT NULL DEFAULT now());
-- statement-breakpoint
UPDATE subscriptions s SET email=r.email,language=r.language FROM pro_upgrade_requests r WHERE r.status='approved' AND r.issued_license_key IS NOT NULL AND s.owner_key=encode(sha256(convert_to('sellpostly-license:'||r.issued_license_key,'UTF8')),'hex') AND s.provider='crypto' AND s.email IS NULL;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION approve_pro_upgrade_request(request_id uuid, license_key text, owner_hash text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE upgrade pro_upgrade_requests%ROWTYPE;
BEGIN
 SELECT * INTO upgrade FROM pro_upgrade_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Upgrade request not found'; END IF;
 IF upgrade.status='approved' THEN RETURN upgrade.issued_license_key; END IF;
 IF upgrade.status<>'pending' THEN RAISE EXCEPTION 'Upgrade request is not pending'; END IF;
 IF license_key !~ '^SP-PRO-[A-F0-9]{64}$' OR owner_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid license'; END IF;
 INSERT INTO subscriptions(owner_key,provider,status,expires_at,email,language) VALUES(owner_hash,'crypto','active',CASE WHEN upgrade.plan IN ('monthly','b2b') THEN now()+interval '30 days' ELSE NULL END,upgrade.email,upgrade.language);
 UPDATE pro_upgrade_requests SET status='approved',issued_license_key=license_key,approved_at=now() WHERE id=request_id;
 RETURN license_key;
END $$;
-- statement-breakpoint
REVOKE ALL ON FUNCTION approve_pro_upgrade_request(uuid,text,text) FROM PUBLIC;


-- Phase 2: independent public catalogs and seller payment preferences.
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS affiliate_catalog jsonb;
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS personal_catalog jsonb;
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS seller_usdc_wallet text NOT NULL DEFAULT '';
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS seller_email text NOT NULL DEFAULT '';
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT true;
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS escrow_enabled boolean NOT NULL DEFAULT true;
-- statement-breakpoint
UPDATE shops SET affiliate_catalog=catalog WHERE affiliate_catalog IS NULL AND coalesce(catalog->>'shopMode','affiliate')='affiliate' AND catalog ? 'products';
-- statement-breakpoint
UPDATE shops SET personal_catalog=catalog WHERE personal_catalog IS NULL AND catalog->>'shopMode'='personal' AND catalog ? 'products';
-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'CRYPTO' CHECK (payment_method IN ('CRYPTO','COD','BANK','CARD_LINK','PAYPAL','PAYONEER','WISE','USDC_DIRECT','TRON_USDT'));
-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'PENDING' CHECK (escrow_status IN ('NONE','PENDING','PENDING_FUNDING','HELD','RELEASED','DISPUTED','REFUNDED','CANCELLED'));
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_coin_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_coin_check CHECK ((payment_method='CRYPTO' AND coin IN ('USDC','USDT')) OR (payment_method<>'CRYPTO' AND coin IN ('USD','EUR','GBP','MAD','AED','SAR','USDC','USDT')));
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_network_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_network_check CHECK ((payment_method='CRYPTO' AND network IN ('Polygon','Base','Arbitrum','BNB Smart Chain','Solana')) OR (payment_method<>'CRYPTO' AND network IN ('COD','BANK','CARD_LINK','PAYPAL','PAYONEER','WISE','TRON','Polygon','Base','Arbitrum','BNB Smart Chain','Solana')));
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_commission_rate_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_commission_rate_check CHECK ((payment_method='CRYPTO' AND commission_rate=0.05) OR (payment_method<>'CRYPTO' AND commission_rate=0));
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','held','released','disputed','refunded','cancelled','fulfilled'));
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_cod_request_id ON orders(shop_id,(details->>'request_id')) WHERE payment_method='COD';
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_order_hold() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE blocked boolean; confirmed_at timestamptz;
BEGIN
 IF TG_OP='INSERT' THEN
  SELECT escrow_hold_days,suspended INTO NEW.escrow_hold_days,blocked FROM shops WHERE id=NEW.shop_id FOR SHARE;
  IF blocked THEN RAISE EXCEPTION 'Store suspended'; END IF;
  IF NEW.force_released_at IS NOT NULL THEN RAISE EXCEPTION 'Force release requires an existing buyer-confirmed order'; END IF;
 ELSE
  IF NEW.shop_id<>OLD.shop_id OR NEW.payment_method<>OLD.payment_method THEN RAISE EXCEPTION 'Order shop or payment method cannot change'; END IF;
  NEW.escrow_hold_days:=OLD.escrow_hold_days;
 END IF;
 IF NEW.payment_method<>'CRYPTO' THEN
  IF NEW.status NOT IN ('pending','fulfilled','cancelled') OR NEW.tx_id IS NOT NULL OR NEW.payment_verified_at IS NOT NULL OR NEW.escrow_release_at IS NOT NULL OR NEW.force_released_at IS NOT NULL THEN RAISE EXCEPTION 'Direct orders cannot enter crypto escrow'; END IF;
  NEW.escrow_status:='NONE';NEW.commission_rate:=0;
  RETURN NEW;
 END IF;
 NEW.commission_rate:=0.05;
 NEW.escrow_status:=CASE NEW.status WHEN 'held' THEN 'HELD' WHEN 'released' THEN 'RELEASED' WHEN 'disputed' THEN 'DISPUTED' WHEN 'refunded' THEN 'REFUNDED' WHEN 'cancelled' THEN 'CANCELLED' ELSE CASE WHEN NEW.details->>'escrow_governance'='usdc_only' THEN 'PENDING_FUNDING' ELSE 'PENDING' END END;
 IF NEW.status='fulfilled' THEN RAISE EXCEPTION 'Crypto order uses escrow lifecycle'; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.payment_verified_at IS NOT NULL AND (NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at OR NEW.gross_amount<>OLD.gross_amount OR NEW.coin<>OLD.coin OR NEW.network<>OLD.network OR NEW.tx_id IS DISTINCT FROM OLD.tx_id) THEN RAISE EXCEPTION 'Verified payment cannot change'; END IF;
  IF NEW.force_released_at IS DISTINCT FROM OLD.force_released_at THEN
   IF OLD.force_released_at IS NOT NULL THEN RAISE EXCEPTION 'Force release audit cannot change'; END IF;
   BEGIN confirmed_at:=(OLD.details->>'buyer_confirmed_at')::timestamptz; EXCEPTION WHEN OTHERS THEN confirmed_at:=NULL; END;
   IF NEW.status<>'released' OR OLD.status NOT IN ('held','disputed') OR confirmed_at IS NULL OR OLD.payment_verified_at IS NULL OR confirmed_at<OLD.payment_verified_at OR confirmed_at>now() THEN RAISE EXCEPTION 'Buyer confirmation required for force release'; END IF;
   NEW.force_released_at:=now();
  END IF;
 END IF;
 IF NEW.payment_verified_at IS NOT NULL THEN NEW.escrow_release_at:=NEW.payment_verified_at+make_interval(days=>NEW.escrow_hold_days); END IF;
 IF NEW.status='released' AND (NEW.escrow_release_at IS NULL OR NEW.escrow_release_at>now()) AND NEW.force_released_at IS NULL THEN RAISE EXCEPTION 'Escrow hold has not ended'; END IF;
 RETURN NEW;
END $$;
-- statement-breakpoint
UPDATE orders SET escrow_status=CASE status WHEN 'held' THEN 'HELD' WHEN 'released' THEN 'RELEASED' WHEN 'disputed' THEN 'DISPUTED' WHEN 'refunded' THEN 'REFUNDED' WHEN 'cancelled' THEN 'CANCELLED' ELSE CASE WHEN details->>'escrow_governance'='usdc_only' THEN 'PENDING_FUNDING' ELSE 'PENDING' END END WHERE payment_method='CRYPTO' AND escrow_status IS DISTINCT FROM CASE status WHEN 'held' THEN 'HELD' WHEN 'released' THEN 'RELEASED' WHEN 'disputed' THEN 'DISPUTED' WHEN 'refunded' THEN 'REFUNDED' WHEN 'cancelled' THEN 'CANCELLED' ELSE 'PENDING' END;

-- statement-breakpoint
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_polygon_payout_wallet;
-- statement-breakpoint
ALTER TABLE shops ADD CONSTRAINT shops_polygon_payout_wallet CHECK (seller_usdc_wallet='' OR (seller_usdc_wallet ~ '^0x[0-9a-fA-F]{40}$' AND seller_usdc_wallet <> '0x0000000000000000000000000000000000000000'));

-- statement-breakpoint
UPDATE shops SET seller_usdc_wallet=personal_catalog->>'cryptoWallet' WHERE seller_usdc_wallet='' AND personal_catalog->>'cryptoWallet' ~ '^0x[0-9a-fA-F]{40}$' AND personal_catalog->>'cryptoWallet' <> '0x0000000000000000000000000000000000000000';

-- Each seller gets both aliases; a never-used mode starts with an empty catalog.
-- statement-breakpoint
UPDATE shops SET affiliate_catalog=jsonb_set(jsonb_set(catalog-'heroTitle'-'heroSubtitle'-'heroImage'-'shopAccent','{shopMode}','"affiliate"'),'{products}','[]') WHERE affiliate_catalog IS NULL AND catalog ? 'products';
-- statement-breakpoint
UPDATE shops SET personal_catalog=jsonb_set(jsonb_set(catalog-'heroTitle'-'heroSubtitle'-'heroImage'-'shopAccent','{shopMode}','"personal"'),'{products}','[]') WHERE personal_catalog IS NULL AND catalog ? 'products';

-- Affiliate disclosure is independent of the Personal catalog.
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS affiliate_disclosure text NOT NULL DEFAULT '';
-- statement-breakpoint
UPDATE shops SET affiliate_disclosure=left(affiliate_catalog->>'affiliateDisclosure',500) WHERE affiliate_disclosure='' AND coalesce(affiliate_catalog->>'affiliateDisclosure','')<>'';

-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('CRYPTO','COD','BANK','CARD_LINK','PAYPAL','PAYONEER','WISE','USDC_DIRECT','TRON_USDT'));
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_escrow_status_check;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_escrow_status_check CHECK (escrow_status IN ('NONE','PENDING','PENDING_FUNDING','HELD','RELEASED','DISPUTED','REFUNDED','CANCELLED'));
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_direct_request_id ON orders(shop_id,payment_method,(details->>'request_id')) WHERE payment_method<>'CRYPTO';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_account_links (
 pro_owner text PRIMARY KEY REFERENCES subscriptions(owner_key),
 account_owner text NOT NULL UNIQUE REFERENCES subscriptions(owner_key),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(pro_owner<>account_owner)
);
-- Multi-shop: the existing general record retains both primary catalogs and its slug.
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS store_mode text NOT NULL DEFAULT 'general' CHECK (store_mode IN ('general','niche'));
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- statement-breakpoint
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_primary boolean GENERATED ALWAYS AS (store_mode='general') STORED;
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
 IF TG_OP='INSERT' AND (NOT FOUND OR subscription_status<>'active' OR (subscription_expiry IS NOT NULL AND subscription_expiry<=now())) THEN RAISE EXCEPTION 'ACTIVE_ACCOUNT_REQUIRED'; END IF;
 IF TG_OP='UPDATE' AND (NEW.owner_key<>OLD.owner_key OR NEW.store_mode<>OLD.store_mode OR NEW.shop_type IS DISTINCT FROM OLD.shop_type) THEN RAISE EXCEPTION 'SHOP_IDENTITY_IMMUTABLE'; END IF;
 IF NEW.store_mode='niche' THEN
  IF NEW.shop_type IS NULL OR length(trim(NEW.niche_name))=0 THEN RAISE EXCEPTION 'NICHE_REQUIRED'; END IF;
  IF TG_OP='INSERT' THEN
   IF subscription_provider='free' AND NOT EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions p ON p.owner_key=l.pro_owner WHERE l.account_owner=NEW.owner_key AND p.provider<>'free' AND p.status='active' AND (p.expires_at IS NULL OR p.expires_at>now())) THEN RAISE EXCEPTION 'PRO_REQUIRED'; END IF;
   IF (SELECT count(*) FROM shops WHERE owner_key=NEW.owner_key AND store_mode='niche' AND deleted_at IS NULL)>=10 THEN RAISE EXCEPTION 'NICHE_LIMIT_REACHED'; END IF;
  END IF;
  IF NEW.shop_type='personal' THEN NEW.affiliate_catalog:=NULL; ELSE NEW.personal_catalog:=NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS shops_plan_limit ON shops;
-- statement-breakpoint
CREATE TRIGGER shops_plan_limit BEFORE INSERT OR UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION enforce_shop_limit();

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_tron_payment_reference ON orders(network,lower(details->>'payment_reference')) WHERE payment_method='TRON_USDT';
-- statement-breakpoint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tron_direct_only;
-- statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_tron_direct_only CHECK ((payment_method<>'TRON_USDT' OR (coin='USDT' AND network='TRON' AND escrow_status='NONE' AND tx_id IS NULL AND details->>'payment_reference' IS NOT NULL AND details->>'payment_reference' ~ '^[a-f0-9]{64}$')) AND (network<>'TRON' OR payment_method='TRON_USDT'));
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_override text CHECK (plan_override IN ('free','pro'));
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_changed_at timestamptz;
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro'));
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_source text;
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION seller_effective_plan(p_owner text) RETURNS text LANGUAGE sql STABLE AS $$
 SELECT coalesce((SELECT CASE WHEN a.status<>'active' THEN 'free' WHEN a.plan='pro' AND (a.plan_expires_at IS NULL OR a.plan_expires_at>now()) AND (a.plan_source IS NULL OR EXISTS(SELECT 1 FROM subscriptions source WHERE source.owner_key=a.plan_source AND source.status='active' AND (source.expires_at IS NULL OR source.expires_at>now() OR source.plan_override='pro'))) THEN 'pro' WHEN a.plan_override IS NOT NULL THEN a.plan_override

 WHEN a.provider<>'free' AND (a.expires_at IS NULL OR a.expires_at>now()) THEN 'pro'
 WHEN EXISTS(SELECT 1 FROM shop_account_links l JOIN subscriptions p ON p.owner_key=l.pro_owner WHERE l.account_owner=a.owner_key AND p.status='active' AND p.plan_override IS DISTINCT FROM 'free' AND (p.expires_at IS NULL OR p.expires_at>now() OR p.plan_override='pro')) THEN 'pro' ELSE 'free' END
 FROM subscriptions a WHERE a.owner_key=coalesce((SELECT account_owner FROM shop_account_links WHERE pro_owner=p_owner),p_owner)),'free')
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_shop_limit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE account_status text;
BEGIN
 IF TG_OP='UPDATE' AND pg_trigger_depth()>1 THEN RETURN NEW; END IF;
 SELECT status INTO account_status FROM subscriptions WHERE owner_key=NEW.owner_key FOR UPDATE;
 IF TG_OP='INSERT' AND (NOT FOUND OR account_status<>'active') THEN RAISE EXCEPTION 'ACTIVE_ACCOUNT_REQUIRED'; END IF;
 IF TG_OP='UPDATE' AND (NEW.owner_key<>OLD.owner_key OR NEW.store_mode<>OLD.store_mode OR NEW.shop_type IS DISTINCT FROM OLD.shop_type) THEN RAISE EXCEPTION 'SHOP_IDENTITY_IMMUTABLE'; END IF;
 IF NEW.store_mode='niche' THEN
  IF NEW.shop_type IS NULL OR length(trim(NEW.niche_name))=0 THEN RAISE EXCEPTION 'NICHE_REQUIRED'; END IF;
  IF TG_OP='INSERT' THEN
   IF seller_effective_plan(NEW.owner_key)<>'pro' THEN RAISE EXCEPTION 'PRO_REQUIRED'; END IF;
   IF (SELECT count(*) FROM shops WHERE owner_key=NEW.owner_key AND store_mode='niche' AND deleted_at IS NULL)>=10 THEN RAISE EXCEPTION 'NICHE_LIMIT_REACHED'; END IF;
  END IF;
  IF NEW.shop_type='personal' THEN NEW.affiliate_catalog:=NULL; ELSE NEW.personal_catalog:=NULL; END IF;
 END IF;
 RETURN NEW;
END $$;

-- statement-breakpoint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_language_check;
-- statement-breakpoint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_language_check CHECK (language IN ('en','fr','es','ar'));
-- statement-breakpoint
ALTER TABLE pro_upgrade_requests DROP CONSTRAINT IF EXISTS pro_upgrade_requests_language_check;
-- statement-breakpoint
ALTER TABLE pro_upgrade_requests ADD CONSTRAINT pro_upgrade_requests_language_check CHECK (language IN ('en','fr','es','ar'));

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS stock_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES shops(id),
 product_id text NOT NULL,
 product_name text NOT NULL,
 variant_id text NOT NULL DEFAULT '',
 variant_label text NOT NULL DEFAULT '',
 sku text NOT NULL DEFAULT '',
 delta integer NOT NULL,
 reason text NOT NULL CHECK (reason IN ('initial','order','restock','return','adjustment')),
 note text NOT NULL DEFAULT '',
 order_id uuid REFERENCES orders(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_shop_date ON stock_movements(shop_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS stock_movements_product ON stock_movements(shop_id,product_id,variant_id);
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_order_line ON stock_movements(order_id,product_id,variant_id,reason) WHERE order_id IS NOT NULL;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION inventory_rows(product jsonb) RETURNS TABLE(variant_id text, variant_label text, sku text, stock integer)
LANGUAGE sql IMMUTABLE AS $$
 SELECT variant->>'id',concat_ws(' / ',nullif(variant->>'size',''),nullif(variant->>'color','')),coalesce(variant->>'sku',''),(variant->>'stockCount')::integer
 FROM jsonb_array_elements(coalesce(product->'variants','[]'::jsonb)) variant
 UNION ALL
 SELECT '','','',(product->>'stock')::integer WHERE jsonb_typeof(product->'stock')='number' AND jsonb_array_length(coalesce(product->'variants','[]'::jsonb))=0
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION reconcile_personal_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 previous jsonb; incoming jsonb; product jsonb; saved jsonb; products jsonb := '[]'; edit jsonb; revision integer; change record;
 wrote_inventory boolean; expected_revision integer;
BEGIN
 IF pg_trigger_depth()>1 THEN RETURN NEW; END IF;
 incoming := coalesce(NEW.personal_catalog,CASE WHEN NEW.catalog->>'shopMode'='personal' THEN NEW.catalog END);
 IF incoming IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  previous := coalesce(OLD.personal_catalog,CASE WHEN OLD.catalog->>'shopMode'='personal' THEN OLD.catalog END);
  IF incoming IS NOT DISTINCT FROM previous THEN RETURN NEW; END IF;
 END IF;
 FOR product IN SELECT value FROM jsonb_array_elements(coalesce(incoming->'products','[]')) LOOP
  SELECT value INTO saved FROM jsonb_array_elements(coalesce(previous->'products','[]')) WHERE value->>'id'=product->>'id' LIMIT 1;
  edit := product->'inventoryEdit';
  expected_revision := coalesce((product->>'inventoryVersion')::integer,0);
  revision := coalesce((saved->>'inventoryVersion')::integer,0);
  -- Only explicit, versioned inventory edits may replace quantities from a shop draft.
  wrote_inventory := saved IS NULL OR (edit->>'id' IS NOT NULL AND edit->>'id' IS DISTINCT FROM coalesce(saved->>'inventoryMutation',saved->'inventoryEdit'->>'id'));
  product := product-'inventoryEdit'-'inventoryVersion'-'inventoryMutation';
  IF wrote_inventory THEN
   IF saved IS NOT NULL AND expected_revision<>revision THEN
    RAISE EXCEPTION 'INVENTORY_CONFLICT';
   END IF;
   IF saved IS NOT NULL AND EXISTS (
    SELECT 1 FROM inventory_rows(saved) before_row
    WHERE NOT EXISTS (SELECT 1 FROM inventory_rows(product) after_row WHERE after_row.variant_id=before_row.variant_id)
     AND EXISTS (SELECT 1 FROM stock_movements m WHERE m.shop_id=NEW.id AND m.product_id=product->>'id' AND m.variant_id=before_row.variant_id AND m.reason='order'
      AND NOT EXISTS (SELECT 1 FROM stock_movements r WHERE r.order_id=m.order_id AND r.product_id=m.product_id AND r.variant_id=m.variant_id AND r.reason='return'))
   ) THEN RAISE EXCEPTION 'INVENTORY_IN_USE'; END IF;
   FOR change IN SELECT coalesce(a.variant_id,b.variant_id) AS variant_id,coalesce(a.variant_label,b.variant_label) AS variant_label,
    coalesce(a.sku,b.sku) AS sku,coalesce(a.stock,0)-coalesce(b.stock,0) AS delta,b.variant_id IS NULL AS is_initial
    FROM inventory_rows(product) a FULL JOIN inventory_rows(saved) b USING(variant_id)
    WHERE a.variant_id IS NULL OR b.variant_id IS NULL OR a.stock<>b.stock
   LOOP
    INSERT INTO stock_movements(shop_id,product_id,product_name,variant_id,variant_label,sku,delta,reason,note)
    VALUES(NEW.id,product->>'id',product->>'name',change.variant_id,change.variant_label,change.sku,change.delta,
     CASE WHEN change.is_initial THEN 'initial' WHEN edit->>'reason'='restock' AND change.delta>0 THEN 'restock' ELSE 'adjustment' END,coalesce(edit->>'note',''));
   END LOOP;
   product := product||jsonb_build_object('inventoryVersion',revision+1);
   IF edit->>'id' IS NOT NULL THEN product := product||jsonb_build_object('inventoryMutation',edit->>'id'); END IF;
  ELSE
   product := product-'variants'-'stock'||(SELECT coalesce(jsonb_object_agg(key,value),'{}') FROM jsonb_each(saved) WHERE key IN ('stock','variants','inventoryVersion','inventoryMutation'));
  END IF;
  products := products||jsonb_build_array(product);
 END LOOP;
 IF EXISTS (
  SELECT 1 FROM stock_movements m WHERE m.shop_id=NEW.id AND m.reason='order'
   AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(products) p WHERE p->>'id'=m.product_id)
   AND NOT EXISTS (SELECT 1 FROM stock_movements r WHERE r.order_id=m.order_id AND r.product_id=m.product_id AND r.variant_id=m.variant_id AND r.reason='return')
 ) THEN RAISE EXCEPTION 'INVENTORY_IN_USE'; END IF;
 INSERT INTO stock_movements(shop_id,product_id,product_name,variant_id,variant_label,sku,delta,reason)
 SELECT NEW.id,p->>'id',p->>'name',i.variant_id,i.variant_label,i.sku,-i.stock,'adjustment'
 FROM jsonb_array_elements(coalesce(previous->'products','[]')) p
 CROSS JOIN LATERAL inventory_rows(p) i
 WHERE i.stock<>0 AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(products) active WHERE active->>'id'=p->>'id');
 incoming := jsonb_set(incoming,'{products}',products);
 NEW.personal_catalog := incoming;
 IF NEW.catalog->>'shopMode'='personal' THEN NEW.catalog := incoming; END IF;
 RETURN NEW;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION initialize_personal_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO stock_movements(shop_id,product_id,product_name,variant_id,variant_label,sku,delta,reason,note)
 SELECT NEW.id,p->>'id',p->>'name',i.variant_id,i.variant_label,i.sku,i.stock,'initial',coalesce(p->'inventoryEdit'->>'note','')
 FROM jsonb_array_elements(coalesce(coalesce(NEW.personal_catalog,CASE WHEN NEW.catalog->>'shopMode'='personal' THEN NEW.catalog END)->'products','[]')) p
 CROSS JOIN LATERAL inventory_rows(p) i;
 RETURN NEW;
END;
$$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS shop_personal_inventory_insert ON shops;
CREATE TRIGGER shop_personal_inventory_insert AFTER INSERT ON shops FOR EACH ROW EXECUTE FUNCTION initialize_personal_inventory();
DROP TRIGGER IF EXISTS shop_personal_inventory ON shops;
CREATE TRIGGER shop_personal_inventory BEFORE UPDATE OF catalog,personal_catalog ON shops FOR EACH ROW EXECUTE FUNCTION reconcile_personal_inventory();
-- statement-breakpoint
CREATE OR REPLACE FUNCTION move_order_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 inventory_catalog jsonb; line record; product jsonb; variant jsonb; stock_change integer; available integer;
 product_index integer; variant_index integer; returning_stock boolean := TG_OP='UPDATE';
 reason text := CASE WHEN TG_OP='UPDATE' THEN 'return' ELSE 'order' END;
 movement_note text;
BEGIN
 IF returning_stock THEN
  IF NOT (
   (NEW.status IN ('cancelled','refunded') AND OLD.status NOT IN ('cancelled','refunded'))
   OR (NEW.details ? 'inventory_returned_at' AND NOT (OLD.details ? 'inventory_returned_at'))
  ) THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM stock_movements WHERE order_id=NEW.id AND stock_movements.reason='order') THEN RETURN NEW; END IF;
  movement_note := coalesce(NEW.details->>'inventory_return_note', NEW.details->'admin_actions'->-1->>'note','');
 ELSE
  IF NEW.status IN ('cancelled','refunded') OR jsonb_typeof(NEW.details->'items') IS DISTINCT FROM 'array'
    OR jsonb_array_length(NEW.details->'items')=0 THEN RETURN NEW; END IF;
  movement_note := '';
 END IF;
 -- The shop row serializes reservations and returns. Both the order and ledger roll back on failure.
 SELECT coalesce(personal_catalog,catalog) INTO inventory_catalog FROM shops WHERE id=NEW.shop_id FOR NO KEY UPDATE;
 IF inventory_catalog->>'shopMode' IS DISTINCT FROM 'personal' THEN RETURN NEW; END IF;
 FOR line IN
  SELECT input->>'id' AS product_id,coalesce(input->>'variantId','') AS variant_id,(input->>'quantity')::integer AS quantity
  FROM jsonb_array_elements(CASE WHEN returning_stock THEN '[]' ELSE NEW.details->'items' END) input
  UNION ALL
  SELECT m.product_id,m.variant_id,-m.delta FROM stock_movements m WHERE returning_stock AND m.order_id=NEW.id AND m.reason='order'
   AND NOT EXISTS (SELECT 1 FROM stock_movements r WHERE r.order_id=m.order_id AND r.product_id=m.product_id AND r.variant_id=m.variant_id AND r.reason='return')
 LOOP
  SELECT value,(ord-1)::integer INTO product,product_index FROM jsonb_array_elements(coalesce(inventory_catalog->'products','[]')) WITH ORDINALITY p(value,ord)
   WHERE p.value->>'id'=line.product_id LIMIT 1;
  IF product IS NULL OR line.quantity IS NULL OR line.quantity<1 THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  IF line.variant_id<>'' THEN
   SELECT value,(ord-1)::integer INTO variant,variant_index FROM jsonb_array_elements(coalesce(product->'variants','[]')) WITH ORDINALITY v(value,ord)
    WHERE v.value->>'id'=line.variant_id LIMIT 1;
   IF variant IS NULL THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
   available := (variant->>'stockCount')::integer;
  ELSE
   IF jsonb_array_length(coalesce(product->'variants','[]'))>0 THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
   variant := NULL;
   available := (product->>'stock')::integer;
   IF available IS NULL THEN CONTINUE; END IF;
  END IF;
  stock_change := CASE WHEN returning_stock THEN line.quantity ELSE -line.quantity END;
  IF available+stock_change<0 THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  IF available+stock_change>1000000 THEN RAISE EXCEPTION 'INVENTORY_LIMIT'; END IF;
  IF variant IS NOT NULL THEN
   product := jsonb_set(product,ARRAY['variants',variant_index::text,'stockCount'],to_jsonb(available+stock_change));
   available := (SELECT sum((v->>'stockCount')::integer)::integer FROM jsonb_array_elements(product->'variants') v);
  ELSE
   available := available+stock_change;
  END IF;
  product := (product-'inventoryEdit')||jsonb_build_object('stock',available,'inventoryVersion',coalesce((product->>'inventoryVersion')::integer,0)+1);
  inventory_catalog := jsonb_set(inventory_catalog,ARRAY['products',product_index::text],product);
  INSERT INTO stock_movements(shop_id,product_id,product_name,variant_id,variant_label,sku,delta,reason,note,order_id)
  VALUES(NEW.shop_id,line.product_id,product->>'name',line.variant_id,
   concat_ws(' / ',nullif(variant->>'size',''),nullif(variant->>'color','')),coalesce(variant->>'sku',''),stock_change,reason,movement_note,NEW.id);
 END LOOP;
 UPDATE shops SET personal_catalog=inventory_catalog,catalog=CASE WHEN catalog->>'shopMode'='personal' THEN inventory_catalog ELSE catalog END,
  updated_at=now() WHERE id=NEW.shop_id AND coalesce(personal_catalog,catalog) IS DISTINCT FROM inventory_catalog;
 RETURN NEW;
END;
$$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS order_stock_movements ON orders;
CREATE TRIGGER order_stock_movements AFTER INSERT OR UPDATE OF status,details ON orders FOR EACH ROW EXECUTE FUNCTION move_order_inventory();

-- statement-breakpoint
INSERT INTO stock_movements(shop_id,product_id,product_name,variant_id,variant_label,sku,delta,reason)
SELECT s.id,p->>'id',p->>'name',i.variant_id,i.variant_label,i.sku,i.stock,'initial'
FROM shops s
CROSS JOIN LATERAL jsonb_array_elements(coalesce(coalesce(s.personal_catalog,CASE WHEN s.catalog->>'shopMode'='personal' THEN s.catalog END)->'products','[]')) p
CROSS JOIN LATERAL inventory_rows(p) i
WHERE s.deleted_at IS NULL AND p->>'id' IS NOT NULL AND p->>'name' IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM stock_movements m WHERE m.shop_id=s.id AND m.product_id=p->>'id' AND m.variant_id=i.variant_id
);

-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'storefront' CHECK (source IN ('storefront','manual'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount numeric(20,6) NOT NULL DEFAULT 0 CHECK (shipping_amount>=0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric(20,6) NOT NULL DEFAULT 0 CHECK (discount_amount>=0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text;
CREATE SEQUENCE IF NOT EXISTS shop_invoice_number_seq;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION next_shop_invoice_number(order_date timestamptz) RETURNS text LANGUAGE sql VOLATILE AS $$
 SELECT 'INV-'||to_char(order_date AT TIME ZONE 'UTC','YYYY')||'-'||CASE WHEN number<10000 THEN lpad(number::text,4,'0') ELSE number::text END
 FROM nextval('shop_invoice_number_seq') number
$$;
-- statement-breakpoint
UPDATE orders SET invoice_number=next_shop_invoice_number(created_at) WHERE invoice_number IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_number ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS orders_shop_created ON orders(shop_id,created_at DESC);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION assign_shop_invoice() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.invoice_number := next_shop_invoice_number(NEW.created_at);
 RETURN NEW;
END;
$$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS order_invoice_number ON orders;
CREATE TRIGGER order_invoice_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION assign_shop_invoice();
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_customer_profiles (
 shop_id uuid NOT NULL REFERENCES shops(id),
 customer_key uuid NOT NULL,
 tags text[] NOT NULL DEFAULT '{}',
 delivery_note text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (shop_id,customer_key),
 CHECK (tags <@ ARRAY['vip','repeat','confirm']::text[])
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS storefront_visits (
 shop_id uuid NOT NULL REFERENCES shops(id),
 visitor_id uuid NOT NULL,
 visit_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
 PRIMARY KEY (shop_id,visit_day,visitor_id)
);

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_manual_receipt_request ON orders(shop_id,(details->>'request_id')) WHERE source='manual';
