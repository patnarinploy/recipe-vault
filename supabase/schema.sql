-- ============================================================
-- Recipe Vault — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. recipes table
create table if not exists public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  description         text,
  ingredients         text not null,
  instructions        text not null,
  image_url           text,
  category            text,
  cook_time_minutes   int,
  servings            int,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Row-level security
alter table public.recipes enable row level security;

-- Anyone can read recipes
create policy "Public read"
  on public.recipes for select
  using (true);

-- Owner can insert
create policy "Owner insert"
  on public.recipes for insert
  with check (auth.uid() = user_id);

-- Owner can update
create policy "Owner update"
  on public.recipes for update
  using (auth.uid() = user_id);

-- Owner can delete
create policy "Owner delete"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- 3. Storage bucket for recipe images
-- (Create the bucket in Supabase Dashboard → Storage → New bucket)
-- Bucket name: recipe-images  |  Public: ✅

-- Storage policies (run after creating the bucket)
create policy "Public image read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "Auth image upload"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Auth image delete"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.handle_updated_at();
