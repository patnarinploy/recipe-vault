import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Users, Tag, Globe, ChefHat } from "lucide-react";
import RecipeDetailActions from "@/components/RecipeDetailActions";
import type { Recipe } from "@/lib/types";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();
  if (!recipe.is_public && recipe.user_id !== user.id) notFound();

  const isOwner = recipe.user_id === user.id;

  return (
    <div className="max-w-2xl mx-auto pb-24 anim-fade-up">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      {/* Hero image / placeholder */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-8 shadow-sm bg-amber-50 border border-amber-100">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <ChefHat className="w-16 h-16 text-amber-200" />
            <span className="text-sm text-stone-300">ไม่มีรูปภาพ</span>
          </div>
        )}
      </div>

      {/* Title block */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
          {recipe.category && (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              <Tag className="w-3.5 h-3.5" />
              {recipe.category}
            </span>
          )}
          {recipe.is_public && (
            <span className="inline-flex items-center gap-1 text-green-600">
              <Globe className="w-3.5 h-3.5" /> สาธารณะ
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-stone-800 leading-tight">{recipe.title}</h1>
      </div>

      {/* Meta row */}
      {(recipe.cook_time_minutes || recipe.servings) && (
        <div className="flex gap-5 text-sm text-stone-500 border-y border-amber-100 py-3 mb-6">
          {recipe.cook_time_minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              {recipe.cook_time_minutes} นาที
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-400" />
              {recipe.servings} ที่
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <p className="text-stone-500 leading-relaxed italic mb-8 text-sm">{recipe.description}</p>
      )}

      {/* Ingredients */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
          <span>🥕</span> ส่วนผสม
        </h2>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-stone-700 leading-loose whitespace-pre-line text-sm">
          {recipe.ingredients}
        </div>
      </section>

      {/* Instructions */}
      <section>
        <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
          <span>📋</span> วิธีทำ
        </h2>
        <div className="text-stone-700 leading-[2] whitespace-pre-line text-sm">
          {recipe.instructions}
        </div>
      </section>

      {/* Owner FAB (edit / delete / share) */}
      {isOwner && <RecipeDetailActions recipe={recipe} />}
    </div>
  );
}
