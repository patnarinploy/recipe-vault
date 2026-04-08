"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  recipeId: string;
  imageUrl: string | null;
};

export default function DeleteButton({ recipeId, imageUrl }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    // Remove image from storage if exists
    if (imageUrl) {
      const path = imageUrl.split("/recipe-images/")[1];
      if (path) {
        await supabase.storage.from("recipe-images").remove([path]);
      }
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

  if (confirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? "กำลังลบ…" : "ยืนยันลบ"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-sm bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-lg transition-colors"
    >
      ลบ
    </button>
  );
}
