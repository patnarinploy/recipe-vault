"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Pencil, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RecipeViewV2 from "@/components/RecipeViewV2";
import RecipeForm from "@/components/RecipeForm";
import Modal from "@/components/Modal";
import type { Book, Recipe, WriterInfo } from "@/lib/types";

export default function BookViewer({
  book,
  initialRecipes,
  isOwner,
  author,
  autoAdd,
}: {
  book: Book;
  initialRecipes: Recipe[];
  isOwner: boolean;
  author?: WriterInfo;
  autoAdd?: boolean;
}) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [idx, setIdx] = useState(0);
  const [addOpen, setAddOpen] = useState(autoAdd ?? false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);

  const total = recipes.length;
  const current = recipes[idx] ?? null;
  const authorName = author?.display_name ?? author?.username;

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(recipes.length - 1, i + 1)), [recipes.length]);

  // Keyboard arrow navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  async function refreshRecipes() {
    const sb = createClient();
    const { data } = await sb
      .from("recipes")
      .select("*")
      .eq("book_id", book.id)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<Recipe[]>();
    const list = isOwner ? (data ?? []) : (data ?? []).filter((r) => r.is_public);
    setRecipes(list);
    return list;
  }

  async function handleAdded(id: string) {
    setAddOpen(false);
    const list = await refreshRecipes();
    const newIdx = list.findIndex((r) => r.id === id);
    if (newIdx >= 0) setIdx(newIdx);
  }

  async function handleEdited() {
    const prevId = current?.id;
    setEditRecipe(null);
    const list = await refreshRecipes();
    if (prevId) {
      const newIdx = list.findIndex((r) => r.id === prevId);
      if (newIdx >= 0) setIdx(newIdx);
    }
  }

  async function handleDeleted() {
    setEditRecipe(null);
    const list = await refreshRecipes();
    setIdx((i) => Math.min(i, Math.max(0, list.length - 1)));
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="-mx-4 sm:-mx-6 -my-10 flex items-center justify-center"
           style={{ minHeight: "calc(100vh - 4rem)", background: "#0a0500" }}>
        <div className="text-center text-white/70 px-6">
          <BookOpen className="w-16 h-16 mx-auto mb-5 opacity-30" />
          <p className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            {book.title}
          </p>
          <p className="text-sm opacity-50 mb-8">ยังไม่มีสูตรอาหารในเล่มนี้</p>
          {isOwner && (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่มสูตรแรก
            </button>
          )}
        </div>

        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="เพิ่มสูตรอาหาร" maxWidth="max-w-3xl">
          <RecipeForm bookId={book.id} inModal onSuccess={handleAdded} onCancel={() => setAddOpen(false)} />
        </Modal>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <>
      {current && (
        <RecipeViewV2
          recipe={current}
          author={authorName}
          bookTitle={book.title}
        />
      )}

      {/* ── Prev arrow ─────────────────────────────────────────────────────── */}
      {idx > 0 && (
        <button
          onClick={prev}
          aria-label="สูตรก่อนหน้า"
          className="fixed left-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* ── Next arrow ─────────────────────────────────────────────────────── */}
      {idx < total - 1 && (
        <button
          onClick={next}
          aria-label="สูตรถัดไป"
          className="fixed right-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* ── Bottom counter ─────────────────────────────────────────────────── */}
      {total > 1 && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium select-none pointer-events-none"
          style={{
            background: "rgba(10,5,0,0.65)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-jetbrains, monospace)",
            letterSpacing: "0.1em",
          }}
        >
          <span>{String(idx + 1).padStart(2, "0")}</span>
          <span style={{ opacity: 0.35 }}>/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>
      )}

      {/* ── Owner controls ─────────────────────────────────────────────────── */}
      {isOwner && (
        <div className="fixed bottom-5 right-5 z-50 flex gap-2">
          {current && (
            <button
              onClick={() => setEditRecipe(current)}
              aria-label="แก้ไขสูตร"
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setAddOpen(true)}
            aria-label="เพิ่มสูตรใหม่"
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
            style={{ background: "#f97316" }}
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="เพิ่มสูตรอาหาร" maxWidth="max-w-3xl">
        <RecipeForm bookId={book.id} inModal onSuccess={handleAdded} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={!!editRecipe} onClose={() => setEditRecipe(null)} title="แก้ไขสูตรอาหาร" maxWidth="max-w-3xl">
        {editRecipe && (
          <RecipeForm
            recipe={editRecipe}
            bookId={book.id}
            inModal
            showDelete
            onSuccess={handleEdited}
            onDeleted={handleDeleted}
            onCancel={() => setEditRecipe(null)}
          />
        )}
      </Modal>
    </>
  );
}
