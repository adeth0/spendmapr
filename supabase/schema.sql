create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount >= 0),
  category text not null,
  notes text,
  transaction_date date not null default now()::date,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  provider text,
  original_amount numeric(12,2) not null check (original_amount >= 0),
  current_balance numeric(12,2) not null check (current_balance >= 0),
  minimum_payment numeric(12,2) not null check (minimum_payment >= 0),
  apr numeric(5,2) not null default 0 check (apr >= 0),
  acquired_at date not null default now()::date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal_type text not null default 'ISA',
  target_amount numeric(12,2) not null check (target_amount >= 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  monthly_contribution numeric(12,2) not null default 0 check (monthly_contribution >= 0),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.goals enable row level security;

alter table public.debts add column if not exists apr numeric(5,2) not null default 0 check (apr >= 0);
alter table public.debts add column if not exists acquired_at date not null default now()::date;
alter table public.debts add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
on public.transactions
for select
using ((auth.uid()) = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions"
on public.transactions
for insert
with check ((auth.uid()) = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
on public.transactions
for update
using ((auth.uid()) = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
on public.transactions
for delete
using ((auth.uid()) = user_id);

drop policy if exists "Users can view their own debts" on public.debts;
create policy "Users can view their own debts"
on public.debts
for select
using ((auth.uid()) = user_id);

drop policy if exists "Users can insert their own debts" on public.debts;
create policy "Users can insert their own debts"
on public.debts
for insert
with check ((auth.uid()) = user_id);

drop policy if exists "Users can update their own debts" on public.debts;
create policy "Users can update their own debts"
on public.debts
for update
using ((auth.uid()) = user_id);

drop policy if exists "Users can delete their own debts" on public.debts;
create policy "Users can delete their own debts"
on public.debts
for delete
using ((auth.uid()) = user_id);

drop policy if exists "Users can view their own goals" on public.goals;
create policy "Users can view their own goals"
on public.goals
for select
using ((auth.uid()) = user_id);

drop policy if exists "Users can insert their own goals" on public.goals;
create policy "Users can insert their own goals"
on public.goals
for insert
with check ((auth.uid()) = user_id);

drop policy if exists "Users can update their own goals" on public.goals;
create policy "Users can update their own goals"
on public.goals
for update
using ((auth.uid()) = user_id);

drop policy if exists "Users can delete their own goals" on public.goals;
create policy "Users can delete their own goals"
on public.goals
for delete
using ((auth.uid()) = user_id);

-- TrueLayer Open Banking (run after core schema; see migrations for ordering)
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

drop policy if exists "Users read own bank connections" on public.bank_connections;
create policy "Users read own bank connections"
  on public.bank_connections for select using ((auth.uid()) = user_id);
drop policy if exists "Users read own bank accounts" on public.bank_accounts;
create policy "Users read own bank accounts"
  on public.bank_accounts for select using ((auth.uid()) = user_id);
drop policy if exists "Users read own bank transactions" on public.bank_transactions;
create policy "Users read own bank transactions"
  on public.bank_transactions for select using ((auth.uid()) = user_id);

revoke all on public.truelayer_oauth_states from anon, authenticated;
revoke all on public.bank_oauth_tokens from anon, authenticated;
grant all on public.truelayer_oauth_states to service_role;
grant all on public.bank_oauth_tokens to service_role;
