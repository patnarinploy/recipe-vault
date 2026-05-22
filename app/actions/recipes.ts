"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { Recipe } from "@/lib/types";
import { ensurePresetUnit, ensurePresetIngredient } from "@/app/actions/user-presets";

type IngredientRowInput = {
  name: string;
  amount: string;
  unitId: string | null;
  // unitFlex: kept on client-side only; server auto-creates a preset and uses the FK
  unitFlex: string;
};

type RecipePayload = {
  title: string;
  description: string | null;
  ingredientRows: IngredientRowInput[];
  instructions: string;
  image_url: string | null;
  youtube_url: string | null;
  category_id: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  is_public: boolean;
  book_id: string;
};

export async function createRecipe(
  payload: RecipePayload
): Promise<{ id: string } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();

  // Verify the book belongs to the user
  const { data: book } = await supabase
    .from("books")
    .select("user_id")
    .eq("id", payload.book_id)
    .single<{ user_id: string }>();

  if (!book || book.user_id !== user.id) return { error: "ไม่มีสิทธิ์เพิ่มสูตรในเล่มนี้" };

  const { ingredientRows, ...recipeFields } = payload;

  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...recipeFields, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const recipeId = data.id;
  if (ingredientRows.length > 0) {
    // Resolve unit IDs: auto-create preset for any custom unit text
    const rows = await Promise.all(ingredientRows.map(async (r, idx) => {
      let unitId = r.unitId ?? null;
      if (!unitId && r.unitFlex.trim()) {
        unitId = await ensurePresetUnit(r.unitFlex.trim(), user.id);
      }
      const presetId = await ensurePresetIngredient(r.name, user.id);
      return {
        recipe_id: recipeId,
        ingredient_amount: r.amount,
        ingredient_unit_id: unitId,
        ingredient_preset_id: presetId,
        ingredient_sort: idx + 1,
      };
    }));
    await supabase.from("recipe_ingredients").insert(rows);
  }

  return { id: recipeId };
}

export async function updateRecipe(
  id: string,
  payload: Partial<RecipePayload>
): Promise<{ id: string } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  // Ensure ownership
  const { data: existing } = await supabase
    .from("recipes")
    .select("user_id")
    .eq("id", id)
    .single<Pick<Recipe, "user_id">>();

  if (!existing || existing.user_id !== user.id) {
    return { error: "ไม่มีสิทธิ์แก้ไขสูตรนี้" };
  }

  const { ingredientRows, ...recipeFields } = payload;

  const updateData: Record<string, unknown> = {
    ...recipeFields,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("recipes").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  if (ingredientRows !== undefined) {
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    if (ingredientRows.length > 0) {
      const rows = await Promise.all(ingredientRows.map(async (r, idx) => {
        let unitId = r.unitId ?? null;
        if (!unitId && r.unitFlex.trim()) {
          unitId = await ensurePresetUnit(r.unitFlex.trim(), user.id);
        }
        const presetId = await ensurePresetIngredient(r.name, user.id);
        return {
          recipe_id: id,
          ingredient_amount: r.amount,
          ingredient_unit_id: unitId,
          ingredient_preset_id: presetId,
          ingredient_sort: idx + 1,
        };
      }));
      await supabase.from("recipe_ingredients").insert(rows);
    }
  }

  return { id };
}

export async function deleteRecipe(
  id: string
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("recipes")
    .select("user_id, image_url")
    .eq("id", id)
    .single<Pick<Recipe, "user_id" | "image_url">>();

  if (!existing || existing.user_id !== user.id) {
    return { error: "ไม่มีสิทธิ์ลบสูตรนี้" };
  }

  // Remove image from storage
  if (existing.image_url) {
    const path = existing.image_url.split("/recipe-images/")[1];
    if (path) {
      const { createClient: createBrowser } = await import(
        "@/lib/supabase/client"
      );
      // Use server client for storage delete
      supabase.storage.from("recipe-images").remove([path]);
    }
  }

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateRecipeOrder(
  bookId: string,
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("user_id")
    .eq("id", bookId)
    .single<{ user_id: string }>();

  if (!book || book.user_id !== user.id) return { error: "ไม่มีสิทธิ์" };

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("recipes")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i])
      .eq("book_id", bookId);
  }

  // TOC reorder = book-level activity; bump book.updated_at but not recipe.updated_at
  await supabase.from("books").update({ updated_at: new Date().toISOString() }).eq("id", bookId);

  return { success: true };
}

export async function togglePublic(
  id: string,
  isPublic: boolean
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("recipes")
    .select("user_id")
    .eq("id", id)
    .single<Pick<Recipe, "user_id">>();

  if (!existing || existing.user_id !== user.id) {
    return { error: "ไม่มีสิทธิ์" };
  }

  const { error } = await supabase
    .from("recipes")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
