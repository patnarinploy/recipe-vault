import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { Recipe } from "@/lib/types";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();
  if (recipe.user_id !== user.id) redirect("/");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แก้ไขสูตรอาหาร</h1>
      <RecipeForm userId={user.id} recipe={recipe} />
    </div>
  );
}
