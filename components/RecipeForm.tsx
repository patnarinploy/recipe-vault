"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CATEGORIES, type Recipe } from "@/lib/types";
import ImageUpload from "./ImageUpload";
import { createRecipe, updateRecipe } from "@/app/actions/recipes";

type Props = {
  recipe?: Recipe;
};

export default function RecipeForm({ recipe }: Props) {
  const router = useRouter();
  const isEdit = !!recipe;
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(
    recipe?.image_url ?? null
  );

  const [form, setForm] = useState({
    title: recipe?.title ?? "",
    description: recipe?.description ?? "",
    ingredients: recipe?.ingredients ?? "",
    instructions: recipe?.instructions ?? "",
    category: recipe?.category ?? "",
    cook_time_minutes: recipe?.cook_time_minutes?.toString() ?? "",
    servings: recipe?.servings?.toString() ?? "",
  });

  function set(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.ingredients.trim() || !form.instructions.trim()) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, ส่วนผสม, วิธีทำ)");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      ingredients: form.ingredients.trim(),
      instructions: form.instructions.trim(),
      category: form.category || null,
      cook_time_minutes: form.cook_time_minutes
        ? parseInt(form.cook_time_minutes)
        : null,
      servings: form.servings ? parseInt(form.servings) : null,
      image_url: imageUrl,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateRecipe(recipe.id, payload);
        } else {
          await createRecipe(payload);
        }
        toast.success(isEdit ? "แก้ไขสำเร็จ" : "เพิ่มสูตรอาหารแล้ว");
      } catch (err) {
        toast.error("เกิดข้อผิดพลาด: " + (err as Error).message);
      }
    });
  }

  const inputCls =
    "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5"
    >
      {/* Image */}
      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      {/* Title */}
      <div>
        <label className={labelCls}>
          ชื่อสูตรอาหาร <span className="text-red-400">*</span>
        </label>
        <input
          value={form.title}
          onChange={set("title")}
          placeholder="เช่น ต้มยำกุ้ง"
          className={inputCls}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>คำอธิบาย</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={2}
          placeholder="อธิบายสั้นๆ เกี่ยวกับสูตรนี้"
          className={inputCls + " resize-none"}
        />
      </div>

      {/* Category + time + servings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>หมวดหมู่</label>
          <select
            value={form.category}
            onChange={set("category")}
            className={inputCls}
          >
            <option value="">เลือกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>เวลาทำ (นาที)</label>
          <input
            type="number"
            min="1"
            value={form.cook_time_minutes}
            onChange={set("cook_time_minutes")}
            placeholder="30"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>จำนวนที่เสิร์ฟ</label>
          <input
            type="number"
            min="1"
            value={form.servings}
            onChange={set("servings")}
            placeholder="4"
            className={inputCls}
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className={labelCls}>
          ส่วนผสม <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.ingredients}
          onChange={set("ingredients")}
          rows={5}
          placeholder={"- กุ้ง 300 กรัม\n- น้ำ 2 ถ้วย\n- ตะไคร้ 2 ต้น"}
          className={inputCls + " resize-y"}
          required
        />
      </div>

      {/* Instructions */}
      <div>
        <label className={labelCls}>
          วิธีทำ <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.instructions}
          onChange={set("instructions")}
          rows={6}
          placeholder={
            "1. ต้มน้ำให้เดือด\n2. ใส่ตะไคร้และกุ้ง\n3. ปรุงรสด้วยน้ำปลา มะนาว พริก"
          }
          className={inputCls + " resize-y"}
          required
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-stone-200 text-stone-600 rounded-xl py-2.5 text-sm hover:bg-stone-50 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {isPending
            ? "กำลังบันทึก…"
            : isEdit
            ? "บันทึกการแก้ไข"
            : "เพิ่มสูตรอาหาร"}
        </button>
      </div>
    </form>
  );
}
