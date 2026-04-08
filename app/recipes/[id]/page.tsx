import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import type { Recipe } from "@/lib/types";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();

  const isOwner = user?.id === recipe.user_id;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/" className="text-orange-500 hover:underline text-sm mb-4 inline-block">
        ← กลับหน้าหลัก
      </Link>

      {/* Image */}
      {recipe.image_url && (
        <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-6 shadow">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {recipe.category && (
              <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-3 py-1 font-medium">
                {recipe.category}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mt-2">{recipe.title}</h1>
          </div>
          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/recipes/edit/${recipe.id}`}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                แก้ไข
              </Link>
              <DeleteButton recipeId={recipe.id} imageUrl={recipe.image_url} />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex gap-6 text-sm text-gray-500 mb-6">
          {recipe.cook_time_minutes && (
            <span>⏱ {recipe.cook_time_minutes} นาที</span>
          )}
          {recipe.servings && (
            <span>🍽 {recipe.servings} ที่</span>
          )}
        </div>

        {recipe.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{recipe.description}</p>
        )}

        {/* Ingredients */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">🥕 ส่วนผสม</h2>
          <div className="whitespace-pre-line text-gray-700 leading-relaxed">{recipe.ingredients}</div>
        </section>

        {/* Instructions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">📋 วิธีทำ</h2>
          <div className="whitespace-pre-line text-gray-700 leading-relaxed">{recipe.instructions}</div>
        </section>
      </div>
    </div>
  );
}
