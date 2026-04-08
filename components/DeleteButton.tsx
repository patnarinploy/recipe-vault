"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const BUCKET = "recipe-images";

type Props = {
  recipeId: string;
  imageUrl: string | null;
};

export default function DeleteButton({ recipeId, imageUrl }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    if (imageUrl) {
      const path = imageUrl.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) {
      toast.error("ลบไม่สำเร็จ");
      setLoading(false);
      return;
    }

    toast.success("ลบสูตรอาหารแล้ว");
    router.push("/");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={() => setConfirming(false)}
          className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
        >
          {loading ? "กำลังลบ…" : "ยืนยันลบ"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
    >
      <Trash2 className="w-3.5 h-3.5" />
      ลบ
    </button>
  );
}
