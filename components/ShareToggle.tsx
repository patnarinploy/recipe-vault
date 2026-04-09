"use client";

import { useState, useTransition } from "react";
import { togglePublic } from "@/app/actions/recipes";
import toast from "react-hot-toast";

export default function ShareToggle({
  recipeId,
  initialPublic,
}: {
  recipeId: string;
  initialPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isPublic;
    startTransition(async () => {
      const res = await togglePublic(recipeId, next);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setIsPublic(next);
      toast.success(next ? "แชร์เป็นสาธารณะแล้ว 🌐" : "ตั้งเป็นส่วนตัวแล้ว 🔒");
    });
  }

  return (
    <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-stone-700">แชร์สูตรสาธารณะ</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {isPublic ? "ผู้ใช้ทุกคนมองเห็นสูตรนี้" : "เฉพาะคุณเท่านั้นที่มองเห็น"}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${
          isPublic ? "bg-orange-500" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            isPublic ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
