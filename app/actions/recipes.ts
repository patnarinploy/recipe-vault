"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { RecipeFormData } from "@/lib/types";

export async function createRecipe(data: RecipeFormData) {
  const supabase = await createClient();
  const { error, data: row } = await supabase
    .from("recipes")
    .insert(data)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/recipes/${row.id}`);
}

export async function updateRecipe(id: string, data: Partial<RecipeFormData>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect(`/recipes/${id}`);
}
