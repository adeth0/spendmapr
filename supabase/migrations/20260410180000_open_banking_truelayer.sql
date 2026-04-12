-- TrueLayer Open Banking: connections, OAuth tokens (service role only), accounts, transactions

create table if not exists public.truelayer_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_id text,
  status text not null default 'active' check (status in ('active', 'error', 'revoked')),
  created_at timestamptz not null default now(),
  last_sync_at timestamptz
);

create table if not exists public.bank_oauth_tokens (
  connection_id uuid primary key references public.bank_connections (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null references public.bank_connections (id) on delete cascade,
  truelayer_account_id text not null,
  display_name text,
  account_type text,
  currency text,
  current_balance numeric(18, 2),
  available_balance numeric(18, 2),
  updated_at timestamptz not null default now(),
  unique (user_id, truelayer_account_id)
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.bank_accounts (id) on delete cascade,
  truelayer_transaction_id text not null,
  amount numeric(18, 2) not null,
  currency text,
  description text,
  booking_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, truelayer_transaction_id)
);

create index if not exists bank_transactions_user_booking_idx
  on public.bank_transactions (user_id, booking_date desc);

create index if not exists bank_accounts_user_idx on public.bank_accounts (user_id);
create index if not exists bank_connections_user_idx on public.bank_connections (user_id);

alter table public.bank_connections enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;

-- End-user read own banking data (writes happen server-side with service role)
create policy "Users read own bank connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users read own bank accounts"
  on public.bank_accounts for select
  using (auth.uid() = user_id);

create policy "Users read own bank transactions"
  on public.bank_transactions for select
  using (auth.uid() = user_id);

-- OAuth state + tokens: never expose via PostgREST to anon/authenticated
revoke all on public.truelayer_oauth_states from anon, authenticated;
revoke all on public.bank_oauth_tokens from anon, authenticated;

grant all on public.truelayer_oauth_states to service_role;
grant all on public.bank_oauth_tokens to service_role;

grant usage on schema public to service_role;
