"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { PresetUnit, PresetCategory, PresetIngredient } from "@/lib/types";

// ─── Units ────────────────────────────────────────────────────────

export async function getUserPresetUnits(): Promise<PresetUnit[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("preset_units")
    .select("*")
    .eq("user_id", user.id)
    .order("unit_name_th");
  return (data ?? []) as PresetUnit[];
}

export async function createPresetUnit(
  payload: { unit_name_th: string; unit_name_en: string },
): Promise<PresetUnit | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("preset_units")
    .insert({ ...payload, is_active: true, user_id: user.id })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/");
  return data as PresetUnit;
}

export async function updatePresetUnit(
  id: string,
  payload: { unit_name_th?: string; unit_name_en?: string },
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_units")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function setPresetUnitActive(
  id: string,
  is_active: boolean,
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_units")
    .update({ is_active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function deletePresetUnit(id: string): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_units")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

// ─── Categories ───────────────────────────────────────────────────

export async function getUserPresetCategories(): Promise<PresetCategory[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("preset_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name_th");
  return (data ?? []) as PresetCategory[];
}

export async function createPresetCategory(
  payload: { name_th: string; name_en: string },
): Promise<PresetCategory | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("preset_categories")
    .insert({ ...payload, is_active: true, user_id: user.id })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/");
  return data as PresetCategory;
}

export async function updatePresetCategory(
  id: string,
  payload: { name_th?: string; name_en?: string },
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_categories")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function setPresetCategoryActive(
  id: string,
  is_active: boolean,
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_categories")
    .update({ is_active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function deletePresetCategory(id: string): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

// ─── Ingredients ──────────────────────────────────────────────────

export async function getUserPresetIngredients(): Promise<PresetIngredient[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("preset_ingredients")
    .select("*")
    .eq("user_id", user.id)
    .order("name_th");
  return (data ?? []) as PresetIngredient[];
}

export async function createPresetIngredient(
  payload: { name_th: string; name_en: string },
): Promise<PresetIngredient | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("preset_ingredients")
    .insert({ ...payload, is_active: true, user_id: user.id })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/settings/dropdowns");
  return data as PresetIngredient;
}

export async function updatePresetIngredient(
  id: string,
  payload: { name_th?: string; name_en?: string },
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_ingredients")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings/dropdowns");
  return {};
}

export async function setPresetIngredientActive(
  id: string,
  is_active: boolean,
): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_ingredients")
    .update({ is_active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings/dropdowns");
  return {};
}

// ─── Auto-create preset ingredient (used by recipe save) ──────────
export async function ensurePresetIngredient(name: string, userId: string): Promise<string | null> {
  if (!name.trim()) return null;
  const supabase = await createClient();
  const trimmed = name.trim();
  // Match by name_th first, then name_en (user may type in either language)
  const { data: byTh } = await supabase
    .from("preset_ingredients")
    .select("id")
    .eq("user_id", userId)
    .eq("name_th", trimmed)
    .maybeSingle();
  if (byTh) return byTh.id;
  const { data: byEn } = await supabase
    .from("preset_ingredients")
    .select("id")
    .eq("user_id", userId)
    .eq("name_en", trimmed)
    .maybeSingle();
  if (byEn) return byEn.id;
  // New: store in both fields so EN users see the name too; they can correct it in Settings later
  const { data: created } = await supabase
    .from("preset_ingredients")
    .insert({ name_th: trimmed, name_en: trimmed, is_active: true, user_id: userId })
    .select("id")
    .single();
  return created?.id ?? null;
}

// ─── Auto-create preset unit (used by recipe save) ────────────────
// Finds existing preset unit for this user by name, or creates one with
// the same TH and EN name. User can edit the EN name later in settings.
export async function ensurePresetUnit(
  nameTh: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  // Try to find existing
  const { data: existing } = await supabase
    .from("preset_units")
    .select("id")
    .eq("user_id", userId)
    .eq("unit_name_th", nameTh.trim())
    .maybeSingle();
  if (existing) return existing.id;
  // Create new
  const { data: created } = await supabase
    .from("preset_units")
    .insert({ unit_name_th: nameTh.trim(), unit_name_en: nameTh.trim(), is_active: true, user_id: userId })
    .select("id")
    .single();
  return created?.id ?? null;
}

// ─── Detail queries (used by preset detail modal) ─────────────────

type RecipeRef = { id: string; title: string };

export async function getRecipesByIngredientId(ingredientId: string): Promise<RecipeRef[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id")
    .eq("ingredient_preset_id", ingredientId);
  if (!rows || rows.length === 0) return [];
  const ids = [...new Set(rows.map(r => r.recipe_id))];
  const { data } = await supabase
    .from("recipes")
    .select("id, title")
    .in("id", ids)
    .eq("user_id", user.id)
    .order("title");
  return (data ?? []) as RecipeRef[];
}

export async function getRecipesByUnitId(unitId: string): Promise<RecipeRef[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id")
    .eq("ingredient_unit_id", unitId);
  if (!rows || rows.length === 0) return [];
  const ids = [...new Set(rows.map(r => r.recipe_id))];
  const { data } = await supabase
    .from("recipes")
    .select("id, title")
    .in("id", ids)
    .eq("user_id", user.id)
    .order("title");
  return (data ?? []) as RecipeRef[];
}

export async function getRecipesByCategoryId(categoryId: string): Promise<RecipeRef[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .order("title");
  return (data ?? []) as RecipeRef[];
}

export async function getIngredientsByStoreId(storeId: string): Promise<{ id: string; name_th: string; name_en: string }[]> {
  const user = await getSession();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("preset_ingredient_stores")
    .select("preset_ingredient_id")
    .eq("store_id", storeId)
    .eq("user_id", user.id);
  if (!data || data.length === 0) return [];
  const ids = data.map(r => r.preset_ingredient_id);
  const { data: presets } = await supabase
    .from("preset_ingredients")
    .select("id, name_th, name_en")
    .in("id", ids)
    .eq("user_id", user.id);
  return (presets ?? []) as { id: string; name_th: string; name_en: string }[];
}
