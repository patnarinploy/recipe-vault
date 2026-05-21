-- preset_ingredients: per-user ingredient library (mirrors preset_units / preset_categories)
create table if not exists public.preset_ingredients (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references public.users(id) on delete cascade,
  name_th     text         not null,
  name_en     text         not null default '',
  is_active   boolean      not null default true,
  created_at  timestamptz  not null default now()
);
create index if not exists preset_ingredients_user_idx on public.preset_ingredients(user_id);
alter table public.preset_ingredients enable row level security;
create policy "preset_ingredients_owner" on public.preset_ingredients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
