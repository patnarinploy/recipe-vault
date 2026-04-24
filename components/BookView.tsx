"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Globe, Search, ChefHat, BookOpen } from "lucide-react";
import { CATEGORIES, type Recipe } from "@/lib/types";
import AddRecipeButton from "./AddRecipeButton";

const ALL = "__all__";

const CAT_EMOJI: Record<string, string> = {
  "อาหารไทย":     "🍜",
  "อาหารจีน":     "🥟",
  "อาหารญี่ปุ่น": "🍱",
  "อาหารตะวันตก": "🍔",
  "อาหารอิตาลี":  "🍝",
  "อาหารอินเดีย": "🍛",
  "ของหวาน":      "🍰",
  "เครื่องดื่ม":  "🧃",
  "อื่นๆ":        "🍳",
};

interface Props {
  myRecipes: Recipe[];
  publicRecipes: Recipe[];
  username: string;
}

/* ── Staggered recipe card ────────────────────────────────────────── */
function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="stagger-child group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative w-full h-44 bg-amber-50 shrink-0 overflow-hidden">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat className="w-12 h-12 text-amber-200" />
          </div>
        )}
        {recipe.is_public && (
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-stone-500 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" /> สาธารณะ
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {recipe.category && (
          <span className="text-[11px] text-amber-600 font-semibold tracking-wide uppercase">
            {CAT_EMOJI[recipe.category] ?? "🍽️"} {recipe.category}
          </span>
        )}
        <h3 className="font-semibold text-stone-800 leading-snug line-clamp-2 group-hover:text-orange-600">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-xs text-stone-400 line-clamp-2 flex-1">{recipe.description}</p>
        )}
        <div className="flex gap-3 text-xs text-stone-400 pt-1">
          {recipe.cook_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{recipe.cook_time_minutes} นาที
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />{recipe.servings} ที่
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Main BookView ────────────────────────────────────────────────── */
export default function BookView({ myRecipes, publicRecipes, username }: Props) {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [activeCat, setActiveCat] = useState(ALL);
  const [search, setSearch] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<"right" | "left">("right");

  const recipes = tab === "mine" ? myRecipes : publicRecipes;

  const usedCats = [ALL, ...CATEGORIES.filter((c) => recipes.some((r) => r.category === c))];

  const filtered = useMemo(() => {
    let list = recipes;
    if (activeCat !== ALL) list = list.filter((r) => r.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [recipes, activeCat, search]);

  function selectCat(cat: string) {
    const oldIdx = usedCats.indexOf(activeCat);
    const newIdx = usedCats.indexOf(cat);
    setAnimDir(newIdx >= oldIdx ? "right" : "left");
    setActiveCat(cat);
    setAnimKey((k) => k + 1);
  }

  function switchTab(t: "mine" | "public") {
    setTab(t);
    setActiveCat(ALL);
    setAnimDir("right");
    setAnimKey((k) => k + 1);
  }

  function countCat(cat: string) {
    const src = tab === "mine" ? myRecipes : publicRecipes;
    return cat === ALL ? src.length : src.filter((r) => r.category === cat).length;
  }

  const catLabel = activeCat === ALL ? "สูตรทั้งหมด" : activeCat;
  const catEmoji = activeCat === ALL ? "📚" : (CAT_EMOJI[activeCat] ?? "🍽️");

  return (
    <div className="book-paper rounded-2xl overflow-hidden shadow-xl border border-amber-100">
      {/* ── Book cover header ──────────────────────────────────── */}
      <div className="bg-white border-b border-amber-100 px-5 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800 leading-tight">
                {tab === "mine" ? `สูตรของ ${username}` : "สูตรสาธารณะ"}
              </h1>
              <p className="text-xs text-stone-400">
                {tab === "mine" ? `${myRecipes.length} สูตรทั้งหมด` : `${publicRecipes.length} สูตรทั้งหมด`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setAnimKey((k) => k + 1); }}
                placeholder="ค้นหาสูตร…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <AddRecipeButton variant="navbar" label="เพิ่มสูตร" />
          </div>
        </div>

        {/* Tab: mine / public */}
        <div className="flex gap-1 mt-3 border-t border-stone-100 pt-3">
          {(["mine", "public"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === t
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              }`}
            >
              {t === "mine" ? "📚 ของฉัน" : "🌐 สาธารณะ"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Book body ─────────────────────────────────────────── */}
      <div className="flex min-h-[560px]">

        {/* Left: สารบัญ (desktop) */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-amber-200/60 bg-amber-50/60">
          <div className="p-5 flex-1">
            <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-4 px-1">
              — สารบัญ —
            </p>
            <nav className="space-y-0.5">
              {usedCats.map((cat, i) => {
                const active = activeCat === cat;
                const emoji = cat === ALL ? "📚" : (CAT_EMOJI[cat] ?? "🍽️");
                return (
                  <button
                    key={cat}
                    onClick={() => selectCat(cat)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                      active
                        ? "bg-orange-100 text-orange-700 font-semibold shadow-sm"
                        : "text-stone-500 hover:bg-amber-100 hover:text-stone-700"
                    }`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="flex-1 text-sm truncate">
                      {cat === ALL ? "ทั้งหมด" : cat}
                    </span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                        active ? "bg-orange-200 text-orange-700" : "bg-amber-100 text-stone-400"
                      }`}
                    >
                      {countCat(cat)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t border-amber-200/60 text-center">
            <ChefHat className="w-5 h-5 mx-auto text-amber-300 mb-1" />
            <p className="text-[10px] text-stone-300">Recipe Vault</p>
          </div>
        </aside>

        {/* Right: content */}
        <div className="flex-1 overflow-hidden">
          {/* Mobile: horizontal category scroll */}
          <div className="md:hidden overflow-x-auto px-4 py-3 border-b border-amber-100 flex gap-2 bg-white/60">
            {usedCats.map((cat) => (
              <button
                key={cat}
                onClick={() => selectCat(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCat === cat
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-amber-100 text-stone-600 hover:bg-amber-200"
                }`}
              >
                {cat === ALL ? "📚 ทั้งหมด" : `${CAT_EMOJI[cat] ?? "🍽️"} ${cat}`}
                <span className="ml-1.5 opacity-70">({countCat(cat)})</span>
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {/* Animated page */}
            <div
              key={animKey}
              className={animDir === "right" ? "anim-slide-right" : "anim-slide-left"}
            >
              {filtered.length > 0 ? (
                <>
                  <div className="flex items-baseline gap-2 mb-5">
                    <h2 className="text-base font-bold text-stone-700">
                      {catEmoji} {catLabel}
                    </h2>
                    <span className="text-sm text-stone-400">{filtered.length} สูตร</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((r, i) => (
                      <RecipeCard key={r.id} recipe={r} index={i} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-stone-400">
                  <ChefHat className="w-14 h-14 mb-3 text-amber-200" />
                  <p className="font-medium text-stone-500">
                    {search ? `ไม่พบสูตรที่ตรงกับ "${search}"` : "ยังไม่มีสูตรอาหาร"}
                  </p>
                  {!search && tab === "mine" && (
                    <div className="mt-4">
                      <AddRecipeButton variant="link" label="เพิ่มสูตรแรกของคุณ →" showIcon={false} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
