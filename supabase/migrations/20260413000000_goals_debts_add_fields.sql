-- Goals: add deadline and emoji columns
alter table public.goals
  add column if not exists deadline date,
  add column if not exists emoji text not null default '🎯';

-- Debts: add type column (Credit Card, Personal Loan, etc.)
alter table public.debts
  add column if not exists type text not null default 'Other';

-- Indexes for common queries
create index if not exists goals_user_created_idx on public.goals (user_id, created_at desc);
create index if not exists debts_user_created_idx on public.debts (user_id, created_at desc);
