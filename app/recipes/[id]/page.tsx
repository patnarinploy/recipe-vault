import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Users, Tag } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import type { Recipe } from "@/lib/types";

export default async function RecipeDetailPage({
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
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      {/* Cover image */}
      {recipe.image_url && (
        <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-6 shadow-md">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            {recipe.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {recipe.category}
              </span>
            )}
            <h1 className="text-2xl font-bold text-stone-800 leading-tight">
              {recipe.title}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              แก้ไข
            </Link>
            <DeleteButton recipeId={recipe.id} imageUrl={recipe.image_url} />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-stone-500">
          {recipe.cook_time_minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {recipe.cook_time_minutes} นาที
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {recipe.servings} ที่
            </span>
          )}
        </div>

        {recipe.description && (
          <p className="text-stone-600 leading-relaxed">{recipe.description}</p>
        )}

        <hr className="border-stone-100" />

        {/* Ingredients */}
        <section>
          <h2 className="text-base font-semibold text-stone-700 mb-3 flex items-center gap-2">
            🥕 ส่วนผสม
          </h2>
          <div className="bg-orange-50 rounded-xl p-4 text-stone-700 leading-relaxed whitespace-pre-line text-sm">
            {recipe.ingredients}
          </div>
        </section>

        {/* Instructions */}
        <section>
          <h2 className="text-base font-semibold text-stone-700 mb-3 flex items-center gap-2">
            📋 วิธีทำ
          </h2>
          <div className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">
            {recipe.instructions}
          </div>
        </section>
      </div>
    </div>
  );
}
