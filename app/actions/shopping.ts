"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { DbIngredient, Recipe, ShoppingListEntry } from "@/lib/types";

export async function addToShoppingList(
  recipeId: string,
): Promise<{ quantity: number } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("shopping_list")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (existing) {
    const newQty = existing.quantity + 1;
    await supabase
      .from("shopping_list")
      .update({ quantity: newQty })
      .eq("id", existing.id);
    revalidatePath("/");
    return { quantity: newQty };
  }

  const { count } = await supabase
    .from("shopping_list")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  await supabase
    .from("shopping_list")
    .insert({ user_id: user.id, recipe_id: recipeId, quantity: 1, sort_order: (count ?? 0) + 1 });

  revalidatePath("/");
  return { quantity: 1 };
}

export async function removeFromShoppingList(
  recipeId: string,
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  await supabase
    .from("shopping_list")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);
  revalidatePath("/");
  return { success: true };
}

export async function updateShoppingQuantity(
  recipeId: string,
  quantity: number,
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  if (quantity < 1) return removeFromShoppingList(recipeId);
  const supabase = await createClient();
  await supabase
    .from("shopping_list")
    .update({ quantity })
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);
  revalidatePath("/");
  return { success: true };
}

export async function clearShoppingList(): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  await supabase.from("shopping_list").delete().eq("user_id", user.id);
  revalidatePath("/");
  return { success: true };
}

export async function getShoppingListCount(): Promise<number> {
  const user = await getSession();
  if (!user) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("shopping_list")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}

export async function getShoppingList(): Promise<ShoppingListEntry[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("shopping_list")
    .select("recipe_id, quantity, sort_order, created_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) return [];

  const recipeIds = rows.map(r => r.recipe_id);

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

  const recipeMap = new Map<string, Recipe>((recipesRes.data ?? []).map(r => [r.id, r]));

  return rows
    .map(row => {
      const recipe = recipeMap.get(row.recipe_id);
      if (!recipe) return null;
      return {
        quantity: row.quantity,
        recipe: { ...recipe, ingredient_rows: ingByRecipe.get(recipe.id) ?? [] },
      };
    })
    .filter((e): e is ShoppingListEntry => e !== null);
}
