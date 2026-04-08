import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Recipe } from "@/lib/types";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/recipes/${id}`}
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับสูตรอาหาร
      </Link>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">แก้ไขสูตรอาหาร</h1>
      <RecipeForm recipe={recipe} />
    </div>
  );
}
