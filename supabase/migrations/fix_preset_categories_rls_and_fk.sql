-- Fix 1: Correct RLS policy for preset_categories
-- In this project public.users.id ≠ auth.uid(), so we must resolve via users.auth_id
ALTER TABLE public.preset_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preset_categories_owner" ON public.preset_categories;
DROP POLICY IF EXISTS "categories_owner" ON public.preset_categories;

CREATE POLICY "preset_categories_owner" ON public.preset_categories
  FOR ALL
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Fix 2: Ensure FK from recipes.category_id → preset_categories.id exists
ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_category_id_fkey;

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES public.preset_categories(id)
  ON DELETE SET NULL;
