-- ============================================================
-- Recipe Vault — Supabase Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. recipes table
create table if not exists public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  ingredients         text not null,
  instructions        text not null,
  image_url           text,
  category            text,
  cook_time_minutes   int,
  servings            int,
  created_at          timestamptz not null default now()
);

-- 2. Row-Level Security — public (no auth required)
alter table public.recipes enable row level security;

-- Anyone can read
create policy "public_select"
  on public.recipes for select
  using (true);

-- Anyone can insert
create policy "public_insert"
  on public.recipes for insert
  with check (true);

-- Anyone can update
create policy "public_update"
  on public.recipes for update
  using (true);

-- Anyone can delete
create policy "public_delete"
  on public.recipes for delete
  using (true);

-- ============================================================
-- Storage: create bucket then run policies below
-- Dashboard → Storage → New bucket
--   Name : recipe-images
--   Public: ✅ ON
-- ============================================================

create policy "public_image_select"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "public_image_insert"
  on storage.objects for insert
  with check (bucket_id = 'recipe-images');

create policy "public_image_delete"
  on storage.objects for delete
  using (bucket_id = 'recipe-images');
