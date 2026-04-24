"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Edit2, Trash2, Globe, Lock, X } from "lucide-react";
import { deleteRecipe, togglePublic } from "@/app/actions/recipes";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import RecipeForm from "./RecipeForm";
import toast from "react-hot-toast";
import type { Recipe } from "@/lib/types";

export default function RecipeDetailActions({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteRecipe(recipe.id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("ลบสูตรอาหารแล้ว");
      router.push("/");
    });
  }

  function handleTogglePublic() {
    const next = !isPublic;
    startTransition(async () => {
      const res = await togglePublic(recipe.id, next);
      if ("error" in res) { toast.error(res.error); return; }
      setIsPublic(next);
      setMenuOpen(false);
      toast.success(next ? "แชร์เป็นสาธารณะแล้ว 🌐" : "ตั้งเป็นส่วนตัวแล้ว 🔒");
      router.refresh();
    });
  }

  return (
    <>
      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {menuOpen && (
          <div className="anim-scale-in bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[11rem] flex flex-col gap-0.5">

            {/* Edit */}
            <button
              onClick={() => { setMenuOpen(false); setEditOpen(true); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              <Edit2 className="w-4 h-4 text-stone-400" /> แก้ไขสูตร
            </button>

            {/* Share toggle */}
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

            {/* Delete */}
            {confirmDelete ? (
              <div className="px-4 py-2.5 space-y-2">
                <p className="text-xs text-stone-500 font-medium">ยืนยันการลบ?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {isPending ? <span className="spinner" /> : "ลบ"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="w-4 h-4" /> ลบสูตร
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => { setMenuOpen((o) => !o); setConfirmDelete(false); }}
          aria-label="จัดการสูตร"
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
            menuOpen
              ? "bg-stone-700 text-white rotate-90"
              : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
          }`}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
        </button>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="แก้ไขสูตรอาหาร">
        <RecipeForm
          recipe={recipe}
          inModal
          onSuccess={() => { setEditOpen(false); router.refresh(); }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </>
  );
}
