"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Edit2, List, Palette, Globe, Lock, MoreHorizontal, X,
} from "lucide-react";
import Modal from "./Modal";
import RecipeForm from "./RecipeForm";
import BookCoverEditor from "./BookCoverEditor";
import { togglePublic } from "@/app/actions/recipes";
import type { Book, Recipe } from "@/lib/types";

interface Props {
  context: "cover" | "toc" | "recipe";
  book: Book;
  recipe: Recipe | null;
  isOwner: boolean;
  onBackToToC: () => void;
}

export default function BookFAB({ context, book, recipe, isOwner, onBackToToC }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);
  const [editRecipeOpen, setEditRecipeOpen] = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe?.is_public ?? false);
  const [isPending, startTransition] = useTransition();

  // Sync public state when recipe changes
  if (recipe && recipe.is_public !== isPublic && !isPending) {
    // only update if the recipe ID is different; otherwise user toggled it
  }

  function handleTogglePublic() {
    if (!recipe) return;
    const next = !isPublic;
    startTransition(async () => {
      const res = await togglePublic(recipe.id, next);
      if ("error" in res) { toast.error(res.error); return; }
      setIsPublic(next);
      setOpen(false);
      toast.success(next ? "แชร์เป็นสาธารณะแล้ว 🌐" : "ตั้งเป็นส่วนตัวแล้ว 🔒");
      router.refresh();
    });
  }

  // Non-owner: no FAB
  if (!isOwner) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="anim-scale-in bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[12rem] flex flex-col gap-0.5">

            {/* RECIPE context */}
            {context === "recipe" && recipe && <>
              <button
                onClick={() => { setOpen(false); setEditRecipeOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <Edit2 className="w-4 h-4 text-stone-400" /> แก้ไขสูตร
              </button>
              <button
                onClick={handleTogglePublic}
                disabled={isPending}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl disabled:opacity-50"
              >
                {isPublic
                  ? <><Lock className="w-4 h-4 text-stone-400" /> ตั้งเป็นส่วนตัว</>
                  : <><Globe className="w-4 h-4 text-stone-400" /> แชร์สาธารณะ</>}
              </button>
              <div className="border-t border-stone-100 my-0.5" />
              <button
                onClick={() => { setOpen(false); onBackToToC(); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <List className="w-4 h-4 text-stone-400" /> กลับไปสารบัญ
              </button>
            </>}

            {/* ToC context */}
            {context === "toc" && <>
              <button
                onClick={() => { setOpen(false); setNewRecipeOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <Plus className="w-4 h-4 text-stone-400" /> เพิ่มสูตรในเล่มนี้
              </button>
              <button
                onClick={() => { setOpen(false); setCoverEditorOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <Palette className="w-4 h-4 text-stone-400" /> แก้ไขปกหนังสือ
              </button>
            </>}

            {/* Cover context */}
            {context === "cover" && <>
              <button
                onClick={() => { setOpen(false); setCoverEditorOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <Palette className="w-4 h-4 text-stone-400" /> แก้ไขปกหนังสือ
              </button>
              <button
                onClick={() => { setOpen(false); setNewRecipeOpen(true); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
              >
                <Plus className="w-4 h-4 text-stone-400" /> เพิ่มสูตรในเล่มนี้
              </button>
            </>}
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="เมนู"
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
            open
              ? "bg-stone-700 text-white rotate-90"
              : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
          }`}
        >
          {open ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
        </button>
      </div>

      {/* Modals */}
      <Modal open={newRecipeOpen} onClose={() => setNewRecipeOpen(false)} title="เพิ่มสูตรในเล่มนี้">
        <RecipeForm
          bookId={book.id}
          inModal
          onSuccess={() => { setNewRecipeOpen(false); router.refresh(); }}
          onCancel={() => setNewRecipeOpen(false)}
        />
      </Modal>

      {recipe && (
        <Modal open={editRecipeOpen} onClose={() => setEditRecipeOpen(false)} title="แก้ไขสูตรอาหาร">
          <RecipeForm
            recipe={recipe}
            bookId={book.id}
            inModal
            showDelete
            onSuccess={() => { setEditRecipeOpen(false); router.refresh(); }}
            onCancel={() => setEditRecipeOpen(false)}
            onDeleted={() => { setEditRecipeOpen(false); onBackToToC(); router.refresh(); }}
          />
        </Modal>
      )}

      <Modal
        open={coverEditorOpen}
        onClose={() => setCoverEditorOpen(false)}
        title="แก้ไขปกหนังสือ"
        maxWidth="max-w-3xl"
      >
        <BookCoverEditor
          book={book}
          inModal
          onSuccess={() => { setCoverEditorOpen(false); router.refresh(); }}
          onCancel={() => setCoverEditorOpen(false)}
        />
      </Modal>
    </>
  );
}
