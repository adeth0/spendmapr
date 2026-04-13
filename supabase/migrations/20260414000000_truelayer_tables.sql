-- ─── TrueLayer Open Banking tables ───────────────────────────────────────────
-- Three tables:
--   truelayer_connections  stores OAuth tokens (service-role write only)
--   bank_accounts          connected accounts synced from TrueLayer
--   transactions           individual transactions, deduplicated by truelayer_transaction_id
--
-- All tables have RLS enabled so users can only access their own rows.
-- The truelayer-data Edge Function writes using the service-role key (bypasses RLS).

-- ── truelayer_connections ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.truelayer_connections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text        NOT NULL,
  refresh_token text        NOT NULL,
  expires_at    timestamptz NOT NULL,
  scope         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.truelayer_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read/delete their own connection record.
-- Edge functions use the service role and bypass this policy.
CREATE POLICY "truelayer_connections_self"
  ON public.truelayer_connections
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── bank_accounts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  truelayer_account_id  text          NOT NULL,
  display_name          text          NOT NULL,
  account_type          text          NOT NULL,
  account_number        jsonb,
  currency              text          NOT NULL DEFAULT 'GBP',
  balance               numeric(14,2),
  balance_updated_at    timestamptz,
  provider_id           text,
  provider_display_name text,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),
  UNIQUE(user_id, truelayer_account_id)
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_self"
  ON public.bank_accounts
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx
  ON public.bank_accounts (user_id);

-- ── transactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id               uuid          REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  truelayer_transaction_id text          NOT NULL,
  amount                   numeric(14,2) NOT NULL,
  currency                 text          NOT NULL DEFAULT 'GBP',
  description              text,
  merchant_name            text,
  category                 text,
  transaction_type         text,
  timestamp                timestamptz   NOT NULL,
  running_balance          numeric(14,2),
  created_at               timestamptz   NOT NULL DEFAULT now(),
  UNIQUE(user_id, truelayer_transaction_id)
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_self"
  ON public.transactions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS transactions_user_id_ts_idx
  ON public.transactions (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS transactions_account_id_idx
  ON public.transactions (account_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
-- touch_updated_at() was created in the user_profile migration; safe to re-create.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS truelayer_connections_updated_at ON public.truelayer_connections;
CREATE TRIGGER truelayer_connections_updated_at
  BEFORE UPDATE ON public.truelayer_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
