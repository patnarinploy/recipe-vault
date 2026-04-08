"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Recipe } from "@/lib/types";
import { RECIPE_CATEGORIES } from "@/lib/types";
import ImageUpload from "./ImageUpload";

type Props = {
  userId: string;
  recipe?: Recipe;
};

export default function RecipeForm({ userId, recipe }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!recipe;

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(recipe?.image_url ?? null);

  const [form, setForm] = useState({
    title: recipe?.title ?? "",
    description: recipe?.description ?? "",
    ingredients: recipe?.ingredients ?? "",
    instructions: recipe?.instructions ?? "",
    category: recipe?.category ?? "",
    cook_time_minutes: recipe?.cook_time_minutes?.toString() ?? "",
    servings: recipe?.servings?.toString() ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.ingredients.trim() || !form.instructions.trim()) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      ingredients: form.ingredients.trim(),
      instructions: form.instructions.trim(),
      category: form.category || null,
      cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("recipes").update(payload).eq("id", recipe.id));
    } else {
      ({ error } = await supabase.from("recipes").insert(payload));
    }

    setLoading(false);

    if (error) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } else {
      toast.success(isEdit ? "แก้ไขสูตรอาหารแล้ว" : "เพิ่มสูตรอาหารแล้ว");
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
      {/* Image upload */}
      <ImageUpload userId={userId} value={imageUrl} onChange={setImageUrl} />

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ชื่อสูตรอาหาร <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="เช่น ต้มยำกุ้ง"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="อธิบายสั้นๆ เกี่ยวกับสูตรนี้"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      {/* Category + cook time + servings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">เลือกหมวดหมู่</option>
            {RECIPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลาทำ (นาที)</label>
          <input
            name="cook_time_minutes"
            type="number"
            min="1"
            value={form.cook_time_minutes}
            onChange={handleChange}
            placeholder="30"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่</label>
          <input
            name="servings"
            type="number"
            min="1"
            value={form.servings}
            onChange={handleChange}
            placeholder="4"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ส่วนผสม <span className="text-red-500">*</span>
        </label>
        <textarea
          name="ingredients"
          value={form.ingredients}
          onChange={handleChange}
          rows={5}
          placeholder={"- กุ้ง 300 กรัม\n- น้ำ 2 ถ้วย\n- ตะไคร้ 2 ต้น"}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
          required
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          วิธีทำ <span className="text-red-500">*</span>
        </label>
        <textarea
          name="instructions"
          value={form.instructions}
          onChange={handleChange}
          rows={6}
          placeholder={"1. ต้มน้ำให้เดือด\n2. ใส่ตะไคร้และกุ้ง\n3. ปรุงรสด้วยน้ำปลา มะนาว พริก"}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
          required
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {loading ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสูตรอาหาร"}
        </button>
      </div>
    </form>
  );
}
