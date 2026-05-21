"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { IngredientStorePref, UserStore } from "@/lib/types";

export async function getUserStores(): Promise<UserStore[]> {
  const user = await getSession();
  if (!user) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("user_stores")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as UserStore[];
}

export async function createUserStore(
  name: string,
  color: string,
  lat?: number | null,
  lng?: number | null,
): Promise<UserStore | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  if (!name.trim()) return { error: "name_required" };
  const sb = await createClient();
  const { count } = await sb
    .from("user_stores")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const { data, error } = await sb
    .from("user_stores")
    .insert({
      user_id: user.id,
      name: name.trim(),
      color,
      latitude: lat ?? null,
      longitude: lng ?? null,
      sort_order: (count ?? 0) + 1,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return data as UserStore;
}

export async function updateUserStore(
  id: string,
  patch: { name?: string; color?: string; latitude?: number | null; longitude?: number | null },
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const sb = await createClient();
  const update: Record<string, unknown> = { ...patch };
  if (patch.name) update.name = patch.name.trim();
  const { error } = await sb
    .from("user_stores")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return { success: true };
}

export async function deleteUserStore(id: string): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const sb = await createClient();
  const { error } = await sb
    .from("user_stores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return { success: true };
}

export async function getIngredientStorePrefs(): Promise<IngredientStorePref[]> {
  const user = await getSession();
  if (!user) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("ingredient_store_pref")
    .select("*")
    .eq("user_id", user.id);
  return (data ?? []) as IngredientStorePref[];
}

export async function setIngredientStorePrefs(
  ingredientKey: string,
  storeIds: string[],
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  const sb = await createClient();

  await sb
    .from("ingredient_store_pref")
    .delete()
    .eq("user_id", user.id)
    .eq("ingredient_key", ingredientKey);

  if (storeIds.length > 0) {
    const { error } = await sb.from("ingredient_store_pref").insert(
      storeIds.map(store_id => ({ user_id: user.id, ingredient_key: ingredientKey, store_id })),
    );
    if (error) return { error: error.message };
  }

  return { success: true };
}
