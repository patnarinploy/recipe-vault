import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/RecipeCard";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: recipes } = await query.returns<Recipe[]>();

  const categories = [
    "อาหารไทย", "อาหารจีน", "อาหารญี่ปุ่น", "อาหารตะวันตก",
    "อาหารอิตาลี", "อาหารอินเดีย", "ของหวาน", "เครื่องดื่ม", "อื่นๆ",
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">🍳 Recipe Vault</h1>
        <p className="text-gray-500">คลังสูตรอาหารของคุณ — บันทึก ค้นหา และแชร์สูตรที่คุณรัก</p>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form method="GET" className="flex-1 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="ค้นหาสูตรอาหาร…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <button
            type="submit"
            className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition-colors"
          >
            ค้นหา
          </button>
        </form>
        {user && (
          <Link
            href="/recipes/new"
            className="bg-orange-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors text-center"
          >
            + เพิ่มสูตรอาหาร
          </Link>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category ? "bg-orange-500 text-white" : "bg-white text-gray-600 border hover:bg-orange-50"
          }`}
        >
          ทั้งหมด
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat ? "bg-orange-500 text-white" : "bg-white text-gray-600 border hover:bg-orange-50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Recipe grid */}
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} currentUserId={user?.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🥘</div>
          <p className="text-lg">ยังไม่มีสูตรอาหาร</p>
          {user && (
            <Link href="/recipes/new" className="mt-4 inline-block text-orange-500 underline">
              เพิ่มสูตรแรกของคุณ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
