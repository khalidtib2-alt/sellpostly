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
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_provider_check CHECK (provider IN ('master','gumroad','development','crypto'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS pro_upgrade_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
 plan text NOT NULL CHECK (plan IN ('monthly','lifetime')),
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
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS email text;
-- statement-breakpoint
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','ar'));
-- statement-breakpoint
ALTER TABLE pro_upgrade_requests ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','ar'));
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
 INSERT INTO subscriptions(owner_key,provider,status,expires_at,email,language) VALUES(owner_hash,'crypto','active',CASE WHEN upgrade.plan='monthly' THEN now()+interval '30 days' ELSE NULL END,upgrade.email,upgrade.language);
 UPDATE pro_upgrade_requests SET status='approved',issued_license_key=license_key,approved_at=now() WHERE id=request_id;
 RETURN license_key;
END $$;
-- statement-breakpoint
REVOKE ALL ON FUNCTION approve_pro_upgrade_request(uuid,text,text) FROM PUBLIC;

