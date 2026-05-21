ALTER TABLE public.ingredients
ADD COLUMN IF NOT EXISTS ingredient_preset_id uuid
  REFERENCES public.preset_ingredients(id) ON DELETE SET NULL;
