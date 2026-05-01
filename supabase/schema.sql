-- ════════════════════════════════════════════════════════
--  MarketPulse Pro — Supabase Schema
--  Run this in your Supabase SQL Editor
-- ════════════════════════════════════════════════════════

-- ─── Watchlist ───────────────────────────────────────────
create table if not exists public.watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  created_at  timestamptz default now(),
  unique(user_id, ticker)
);

alter table public.watchlist enable row level security;

create policy "Users can manage their own watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Portfolio positions ──────────────────────────────────
create table if not exists public.portfolio (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  shares      numeric(18,6) not null check (shares > 0),
  avg_cost    numeric(18,4) not null check (avg_cost > 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, ticker)
);

alter table public.portfolio enable row level security;

create policy "Users can manage their own portfolio"
  on public.portfolio for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.portfolio
  for each row execute function public.handle_updated_at();

-- ─── Optional: saved AI insights ─────────────────────────
create table if not exists public.ai_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mode        text not null,
  prompt      text,
  response    text not null,
  created_at  timestamptz default now()
);

alter table public.ai_insights enable row level security;

create policy "Users can manage their own insights"
  on public.ai_insights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
