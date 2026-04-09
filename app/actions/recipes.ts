"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { Recipe } from "@/lib/types";

type RecipePayload = {
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  category: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  is_public: boolean;
};

export async function createRecipe(
  payload: RecipePayload
): Promise<{ id: string } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...payload, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
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

  const { error } = await supabase.from("recipes").update(payload).eq("id", id);
  if (error) return { error: error.message };
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
