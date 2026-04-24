import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import RecipeCard from "@/components/RecipeCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import AddRecipeButton from "@/components/AddRecipeButton";
import Link from "next/link";
import { CATEGORIES, type Recipe } from "@/lib/types";
import { ChefHat } from "lucide-react";
import { Suspense } from "react";

export const revalidate = 0;

type Props = { searchParams: Promise<{ q?: string; cat?: string; view?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const user = await requireSession();
  const { q, cat, view } = await searchParams;

  const supabase = await createClient();
  const showPublic = view === "public";

  let query = supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (showPublic) {
    query = query.eq("is_public", true);
  } else {
    query = query.eq("user_id", user.id);
  }

  if (q) query = query.ilike("title", `%${q}%`);
  if (cat) query = query.eq("category", cat);

  const { data: recipes } = await query.returns<Recipe[]>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {showPublic ? "สูตรสาธารณะ" : "สูตรของฉัน"}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {showPublic
              ? "สูตรอาหารที่ถูกแชร์โดยผู้ใช้ทั้งหมด"
              : `สวัสดี, ${user.username}`}
          </p>
        </div>
        <AddRecipeButton variant="hero" label="เพิ่มสูตรอาหาร" />
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <Link
          href="/"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !showPublic
              ? "bg-orange-500 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:border-orange-300"
          }`}
        >
          สูตรของฉัน
        </Link>
        <Link
          href="/?view=public"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showPublic
              ? "bg-orange-500 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:border-orange-300"
          }`}
        >
          สาธารณะ
        </Link>
      </div>

      {/* Search + Category */}
      <Suspense>
        <SearchBar defaultValue={q} />
        <CategoryFilter categories={[...CATEGORIES]} active={cat} />
      </Suspense>

      {/* Grid */}
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} currentUserId={user.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-stone-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">
            {showPublic ? "ยังไม่มีสูตรสาธารณะ" : "ยังไม่มีสูตรอาหาร"}
          </p>
          {!showPublic && (
            <div className="mt-3">
              <AddRecipeButton variant="link" label="เพิ่มสูตรแรกของคุณ →" showIcon={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
