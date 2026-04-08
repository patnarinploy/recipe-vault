import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/RecipeCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import Link from "next/link";
import { CATEGORIES, type Recipe } from "@/lib/types";
import { PlusCircle, ChefHat } from "lucide-react";

export const revalidate = 0;

type Props = {
  searchParams: Promise<{ q?: string; cat?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { q, cat } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  if (cat) query = query.eq("category", cat);

  const { data: recipes, error } = await query.returns<Recipe[]>();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
          <ChefHat className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-stone-800 tracking-tight">
          Recipe Vault
        </h1>
        <p className="text-stone-500 mt-2">
          คลังสูตรอาหาร — บันทึก ค้นหา และแชร์สูตรที่คุณรัก
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar defaultValue={q} />
        <Link
          href="/recipes/new"
          className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          เพิ่มสูตรอาหาร
        </Link>
      </div>

      {/* Category filter */}
      <CategoryFilter categories={[...CATEGORIES]} active={cat} />

      {/* Grid */}
      {error && (
        <p className="text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      )}

      {!error && recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="text-center py-24 text-stone-400">
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">ยังไม่มีสูตรอาหาร</p>
            <Link
              href="/recipes/new"
              className="mt-3 inline-block text-orange-500 hover:underline text-sm"
            >
              เพิ่มสูตรแรกของคุณ →
            </Link>
          </div>
        )
      )}
    </div>
  );
}
