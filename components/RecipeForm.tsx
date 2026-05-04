"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CATEGORIES, type Recipe } from "@/lib/types";
import ImageUpload from "./ImageUpload";
import { createRecipe, updateRecipe, deleteRecipe } from "@/app/actions/recipes";
import { Plus, Trash2, X, Youtube } from "lucide-react";

const UNITS = [
  "กรัม", "กิโลกรัม", "ขีด",
  "มิลลิลิตร", "ลิตร",
  "ช้อนชา", "ช้อนโต๊ะ", "ถ้วย",
  "ชิ้น", "ฝัก", "ต้น", "ใบ", "หัว", "ลูก", "กลีบ", "แผ่น",
];

interface IngredientRow { name: string; amount: string; unit: string; }
interface InstructionStep { text: string; youtube: string; }

function parseIngredients(text: string): IngredientRow[] {
  if (!text.trim()) return [{ name: "", amount: "", unit: "" }];
  return text.split("\n").filter(l => l.trim()).map(line => {
    const cleaned = line.trim().replace(/^[-•*\d+.]\s*/, "");
    const parts = cleaned.split(/\s+/);
    const knownUnit = UNITS.find(u => parts[parts.length - 1] === u);
    if (knownUnit && parts.length >= 3) {
      return { name: parts.slice(0, -2).join(" "), amount: parts[parts.length - 2], unit: knownUnit };
    }
    return { name: cleaned, amount: "", unit: "" };
  });
}

function parseInstructions(raw: string): InstructionStep[] {
  if (!raw.trim()) return [{ text: "", youtube: "" }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "text" in parsed[0]) {
      return parsed.map((s: { text?: string; youtube?: string }) => ({ text: s.text ?? "", youtube: s.youtube ?? "" }));
    }
  } catch {}
  return raw.split("\n").filter(l => l.trim()).map(line => ({
    text: line.replace(/^\d+\.\s*/, "").trim(),
    youtube: "",
  }));
}

interface Props {
  recipe?: Recipe;
  bookId?: string;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
  onDeleted?: () => void;
  inModal?: boolean;
  showDelete?: boolean;
}

export default function RecipeForm({
  recipe,
  bookId,
  onSuccess,
  onCancel,
  onDeleted,
  inModal,
  showDelete,
}: Props) {
  const router = useRouter();
  const isEdit = !!recipe;
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(recipe?.image_url ?? null);

  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(
    () => parseIngredients(recipe?.ingredients ?? "")
  );
  const [instructionSteps, setInstructionSteps] = useState<InstructionStep[]>(
    () => parseInstructions(recipe?.instructions ?? "")
  );

  const [form, setForm] = useState({
    title: recipe?.title ?? "",
    description: recipe?.description ?? "",
    category: recipe?.category ?? "",
    cook_time_minutes: recipe?.cook_time_minutes?.toString() ?? "",
    servings: recipe?.servings?.toString() ?? "",
    is_public: recipe?.is_public ?? false,
  });

  function addRow() {
    setIngredientRows(r => [...r, { name: "", amount: "", unit: "" }]);
  }
  function removeRow(i: number) {
    setIngredientRows(r => r.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, field: keyof IngredientRow, value: string) {
    setIngredientRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  function addStep() {
    setInstructionSteps(s => [...s, { text: "", youtube: "" }]);
  }
  function removeStep(i: number) {
    setInstructionSteps(s => s.filter((_, idx) => idx !== i));
  }
  function updateStep(i: number, field: keyof InstructionStep, value: string) {
    setInstructionSteps(s => s.map((step, idx) => idx === i ? { ...step, [field]: value } : step));
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ingredientsText = ingredientRows
      .filter(r => r.name.trim())
      .map(r => [r.name.trim(), r.amount.trim(), r.unit].filter(Boolean).join(" "))
      .join("\n");

    const validSteps = instructionSteps.filter(s => s.text.trim());
    if (!form.title.trim() || !ingredientsText || validSteps.length === 0) {
      toast.error("กรุณากรอกชื่อ, ส่วนผสม และวิธีทำ");
      return;
    }

    if (!isEdit && !bookId) {
      toast.error("ไม่มี book_id");
      return;
    }

    const instructionsJson = JSON.stringify(
      validSteps.map(s => ({
        text: s.text.trim(),
        ...(s.youtube.trim() ? { youtube: s.youtube.trim() } : {}),
      }))
    );

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      ingredients: ingredientsText,
      instructions: instructionsJson,
      category: form.category || null,
      cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      image_url: imageUrl,
      is_public: form.is_public,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateRecipe(recipe.id, basePayload)
        : await createRecipe({ ...basePayload, book_id: bookId! });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? "แก้ไขสำเร็จ" : "เพิ่มสูตรอาหารแล้ว");
      if (onSuccess) {
        onSuccess(res.id);
        router.refresh();
      } else {
        router.push(`/recipes/${res.id}`);
        router.refresh();
      }
    });
  }

  const cancel = onCancel ?? (() => router.back());

  function handleDelete() {
    if (!recipe) return;
    startTransition(async () => {
      const res = await deleteRecipe(recipe.id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("ลบสูตรอาหารแล้ว");
      if (onDeleted) onDeleted(); else router.push("/");
    });
  }

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inModal
          ? "bg-white rounded-b-2xl border border-stone-100 border-t-0 shadow-xl overflow-hidden"
          : "bg-white rounded-2xl border border-stone-100 shadow-sm"
      }
    >
      <div
        className={
          inModal
            ? "p-6 space-y-5 max-h-[calc(100vh-10rem)] overflow-y-auto"
            : "p-6 space-y-5"
        }
      >
      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <div>
        <label className={labelCls}>ชื่อสูตรอาหาร <span className="text-red-400">*</span></label>
        <input value={form.title} onChange={set("title")} placeholder="เช่น ต้มยำกุ้ง" className={inputCls} required />
      </div>

      <div>
        <label className={labelCls}>คำอธิบาย</label>
        <textarea value={form.description} onChange={set("description")} rows={2} placeholder="อธิบายสั้นๆ" className={inputCls + " resize-none"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>หมวดหมู่</label>
          <select value={form.category} onChange={set("category")} className={inputCls}>
            <option value="">เลือกหมวดหมู่</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>เวลาทำ (นาที)</label>
          <input type="number" min="1" value={form.cook_time_minutes} onChange={set("cook_time_minutes")} placeholder="30" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>จำนวนที่เสิร์ฟ</label>
          <input type="number" min="1" value={form.servings} onChange={set("servings")} placeholder="4" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>ส่วนผสม <span className="text-red-400">*</span></label>

        {/* Column headers */}
        <div className="grid gap-2 mb-1.5 px-0.5" style={{ gridTemplateColumns: "1fr 3.5rem 6.5rem 2rem" }}>
          <span className="text-xs text-stone-400">วัตถุดิบ</span>
          <span className="text-xs text-stone-400">ปริมาณ</span>
          <span className="text-xs text-stone-400">หน่วย</span>
          <span />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {ingredientRows.map((row, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 3.5rem 6.5rem 2rem" }}>
              <input
                value={row.name}
                onChange={e => updateRow(i, "name", e.target.value)}
                placeholder="เช่น กุ้ง"
                className={inputCls}
              />
              <input
                value={row.amount}
                onChange={e => updateRow(i, "amount", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
              <select
                value={row.unit}
                onChange={e => updateRow(i, "unit", e.target.value)}
                className={inputCls}
              >
                <option value="">ตัวเลือก</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={ingredientRows.length === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:invisible"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มส่วนผสม
        </button>
      </div>

      <div>
        <label className={labelCls}>วิธีทำ <span className="text-red-400">*</span></label>
        <div className="space-y-2.5">
          {instructionSteps.map((step, i) => (
            <div key={i} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
              {/* Step header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-100">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-stone-400 flex-1">ขั้นตอนที่ {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={instructionSteps.length === 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:invisible"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Step text */}
              <textarea
                value={step.text}
                onChange={e => updateStep(i, "text", e.target.value)}
                placeholder={`อธิบายขั้นตอนที่ ${i + 1}`}
                rows={2}
                className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none bg-white border-0"
              />
              {/* YouTube URL */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50/60">
                <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <input
                  value={step.youtube}
                  onChange={e => updateStep(i, "youtube", e.target.value)}
                  placeholder="ลิ้งค์ YouTube ประกอบ (ไม่บังคับ)"
                  className="flex-1 text-sm bg-transparent focus:outline-none text-stone-600 placeholder:text-stone-300"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มขั้นตอน
        </button>
      </div>

      {/* Public toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-stone-200 rounded-full peer peer-checked:bg-orange-500 transition-colors" />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </div>
        <span className="text-sm font-medium text-stone-700">แชร์เป็นสูตรสาธารณะ</span>
      </label>

      <div className="flex gap-3 pt-2">
        {showDelete && isEdit && (
          confirmDelete ? (
            <button type="button" onClick={handleDelete} disabled={isPending}
              className="border border-red-300 bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm disabled:opacity-60">
              {isPending ? "กำลังลบ…" : "ยืนยันลบ"}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="border border-red-200 text-red-500 rounded-xl px-3.5 py-2.5 text-sm hover:bg-red-50 flex items-center"
              title="ลบสูตร">
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
        <button type="button" onClick={() => confirmDelete ? setConfirmDelete(false) : cancel()} className="flex-1 border border-stone-200 text-stone-600 rounded-xl py-2.5 text-sm hover:bg-stone-50 transition-colors">
          {confirmDelete ? "ไม่ลบ" : "ยกเลิก"}
        </button>
        {!confirmDelete && (
          <button type="submit" disabled={isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60">
            {isPending ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสูตรอาหาร"}
          </button>
        )}
      </div>
      </div>
    </form>
  );
}
