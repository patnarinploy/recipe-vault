"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/app/actions/recipes";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteRecipe(recipeId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบสูตรอาหารแล้ว");
      router.push("/");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5">
        <button onClick={() => setConfirming(false)} className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
          ยกเลิก
        </button>
        <button onClick={handleDelete} disabled={isPending} className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60">
          {isPending ? "กำลังลบ…" : "ยืนยันลบ"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors inline-flex items-center gap-1">
      <Trash2 className="w-3.5 h-3.5" />
      ลบ
    </button>
  );
}
