-- ─── user_profile ─────────────────────────────────────────────────────────────
-- Stores onboarding data and financial profile per authenticated user.
-- One row per user (UNIQUE on user_id). Upserted by the client.

CREATE TABLE IF NOT EXISTS public.user_profile (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income       numeric(12,2) NOT NULL DEFAULT 0,
  current_savings      numeric(12,2) NOT NULL DEFAULT 0,
  total_debts_estimate numeric(12,2) NOT NULL DEFAULT 0,
  financial_goals      text[]      NOT NULL DEFAULT '{}',
  onboarding_completed boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Users may only read/write their own row
CREATE POLICY "user_profile_self"
  ON public.user_profile
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_profile_user_id_idx
  ON public.user_profile (user_id);

-- Auto-update updated_at on every row change.
-- touch_updated_at() may already exist from another migration; use CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profile_updated_at ON public.user_profile;
CREATE TRIGGER user_profile_updated_at
  BEFORE UPDATE ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
