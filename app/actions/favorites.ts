"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { DbIngredient, PresetCategory, Recipe } from "@/lib/types";

export async function toggleFavorite(
  recipeId: string,
): Promise<{ favorited: boolean } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("recipe_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);
    if (error) return { error: error.message };
    revalidatePath("/");
    return { favorited: false };
  } else {
    const { error } = await supabase
      .from("recipe_favorites")
      .insert({ user_id: user.id, recipe_id: recipeId });
    if (error) return { error: error.message };
    revalidatePath("/");
    return { favorited: true };
  }
}

export async function getFavoriteCount(): Promise<number> {
  const user = await getSession();
  if (!user) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("recipe_favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}

export async function getFavoriteRecipes(): Promise<Recipe[]> {
  const user = await getSession();
  if (!user) return [];

  const supabase = await createClient();

  // Get favorite recipe IDs ordered by most recently favorited
  const { data: favRows } = await supabase
    .from("recipe_favorites")
    .select("recipe_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const recipeIds = (favRows ?? []).map((r: { recipe_id: string }) => r.recipe_id);
  if (recipeIds.length === 0) return [];

  const [recipesRes, ingRes] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, preset_categories!category_id(*)")
      .in("id", recipeIds)
      .returns<Recipe[]>(),
    supabase
      .from("ingredients")
      .select("*, preset_units(*)")
      .in("recipe_id", recipeIds)
      .order("ingredient_sort")
      .returns<DbIngredient[]>(),
  ]);

  const ingByRecipe = new Map<string, DbIngredient[]>();
  for (const row of ingRes.data ?? []) {
    const arr = ingByRecipe.get(row.recipe_id) ?? [];
    arr.push(row);
    ingByRecipe.set(row.recipe_id, arr);
  }

  // Preserve the favorites order (most recently added first)
  return recipeIds
    .map(id => (recipesRes.data ?? []).find((r: Recipe) => r.id === id))
    .filter((r): r is Recipe => !!r)
    .map(r => ({ ...r, ingredient_rows: ingByRecipe.get(r.id) ?? [] }));
}
