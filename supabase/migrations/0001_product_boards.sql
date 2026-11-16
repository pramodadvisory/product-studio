-- Product Board persistence.
--
-- The board is a single JSON document (see src/lib/product-board/schema.ts), so
-- one row per board and one upsert per save. `product_name` and `status` are
-- duplicated out of `doc` purely so boards can be listed without parsing JSON.
--
-- Run this in the Supabase SQL editor, then add NEXT_PUBLIC_SUPABASE_URL and
-- NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. Until then the app persists to
-- localStorage and says so in the header.

create table if not exists public.product_boards (
  id            text primary key,
  product_name  text        not null,
  status        text        not null default 'Draft',
  doc           jsonb       not null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists product_boards_updated_at_idx
  on public.product_boards (updated_at desc);

alter table public.product_boards enable row level security;

-- NOTE: this app has no auth yet, so these policies are open to the anon key.
-- Replace both with owner-scoped policies (e.g. `auth.uid() = owner_id`) before
-- putting real product data in here.
drop policy if exists product_boards_anon_read on public.product_boards;
create policy product_boards_anon_read
  on public.product_boards for select
  using (true);

drop policy if exists product_boards_anon_write on public.product_boards;
create policy product_boards_anon_write
  on public.product_boards for all
  using (true)
  with check (true);
