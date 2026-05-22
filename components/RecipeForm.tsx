"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type Recipe, type PresetUnit, type PresetCategory, type DbIngredient } from "@/lib/types";
import ImageUpload from "./ImageUpload";
import { createClient } from "@/lib/supabase/client";
import { createRecipe, updateRecipe, deleteRecipe } from "@/app/actions/recipes";
import { Plus, Trash2, X, ChevronDown, ImageIcon, GripVertical } from "lucide-react";
import LoadingButton from "./ui/LoadingButton";
import { ReactSortable } from "react-sortablejs";
import { useLocale } from "@/lib/locale";
const uid = () => Math.random().toString(36).slice(2, 10);

function ytVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([^?&\s]{11})/);
  return m?.[1] ?? null;
}

interface IngredientRow { id: string; name: string; amount: string; unitId: string | null; unitFlex: string; unitDisplay: string; }
interface InstructionStep { id: string; text: string; image_url: string | null; }

// ─── Generic searchable + creatable combobox ──────────────────────
function Combobox({ value, onChange, options, placeholder = "", className = "", wrapperClass = "" }: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  className?: string;
  wrapperClass?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onChange(query.trim());
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, query, onChange]);

  const filtered = options.filter(u => !query || u.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() !== "" && !options.some(u => u.toLowerCase() === query.trim().toLowerCase());

  function select(v: string) { onChange(v); setQuery(v); setOpen(false); }

  return (
    <div ref={wrapRef} className={`relative ${wrapperClass}`}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === "Escape") { onChange(query.trim()); setOpen(false); }
          if (e.key === "Enter") { e.preventDefault(); select(query.trim()); }
        }}
        placeholder={placeholder}
        className={className}
        style={{ paddingRight: "2rem" }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
        <ChevronDown className="w-4 h-4" />
      </div>
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-outline rounded-xl shadow-lg overflow-y-auto"
             style={{ maxHeight: "12rem" }}>
          {!query && placeholder && (
            <button type="button" onClick={() => select("")}
              className="w-full text-left px-3 py-2 text-sm text-muted hover:bg-elevated">
              {placeholder}
            </button>
          )}
          {filtered.map(u => (
            <button key={u} type="button" onClick={() => select(u)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors
                ${u === value ? "font-semibold text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20" : "text-secondary"}`}>
              {u}
            </button>
          ))}
          {showCreate && (
            <button type="button" onClick={() => select(query.trim())}
              className="w-full text-left px-3 py-2 text-sm text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-950/20 border-t border-border transition-colors">
              {t.recipe.createOption} &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── YouTube thumbnail preview card ──────────────────────────────
function YtPreview({ url }: { url: string }) {
  const vid = ytVideoId(url);
  if (!vid) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="mx-3 mb-2 mt-1 rounded-xl overflow-hidden relative block group"
       style={{ aspectRatio: "16/9" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt=""
        className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
          <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "12px solid white", marginLeft: 2 }} />
        </div>
      </div>
    </a>
  );
}

// ─── Compact image upload for instruction steps ───────────────────
function StepImageUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const { t } = useLocale();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.recipe.fileSizeError.replace("{mb}", "5")); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `step-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("recipe-images").upload(path, file, { upsert: true });
    if (error) { toast.error(t.recipe.uploadError); setUploading(false); return; }
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  async function remove() {
    if (value) {
      const path = value.split("/recipe-images/")[1];
      if (path) await supabase.storage.from("recipe-images").remove([path]);
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="px-3 py-2 border-t border-border bg-elevated/60">
      {value ? (
        <div className="relative w-full rounded-xl overflow-hidden group bg-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="block w-full h-auto"
            style={{ maxHeight: "12rem", objectFit: "contain" }} />
          <button type="button" onClick={remove}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-orange-500 transition-colors disabled:opacity-50">
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          {uploading ? t.common.loading : t.recipe.stepUpload}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Parsers ─────────────────────────────────────────────────────
function parseInstructions(raw: string): InstructionStep[] {
  if (!raw.trim()) return [{ id: uid(), text: "", image_url: null }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "text" in parsed[0]) {
      return parsed.map((s: { text?: string; image_url?: string | null }) => ({
        id: uid(),
        text: s.text ?? "",
        image_url: s.image_url ?? null,
      }));
    }
  } catch {}
  return raw.split("\n").filter(l => l.trim()).map(line => ({
    id: uid(),
    text: line.replace(/^\d+\.\s*/, "").trim(),
    image_url: null,
  }));
}

// Backward-compat: read youtube URL from old instructions JSON format
function extractRecipeYoutube(raw: string): string {
  if (!raw.trim()) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const s of parsed as { youtube?: string }[]) {
        if (s.youtube?.trim()) return s.youtube.trim();
      }
    }
  } catch {}
  return "";
}

interface Props {
  recipe?: Recipe;
  bookId?: string;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
  onDeleted?: () => void;
  inModal?: boolean;
  showDelete?: boolean;
  presetUnits?: PresetUnit[];
  presetCategories?: PresetCategory[];
  ingredientNameOptions?: string[];
}

export default function RecipeForm({
  recipe,
  bookId,
  onSuccess,
  onCancel,
  onDeleted,
  inModal,
  showDelete,
  presetUnits = [],
  presetCategories = [],
  ingredientNameOptions = [],
}: Props) {
  const { t, locale } = useLocale();
  const r = t.recipe;
  const router = useRouter();
  const isEdit = !!recipe;
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(recipe?.image_url ?? null);

  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() => {
    // Primary path: structured rows from DB
    if (recipe?.ingredient_rows && recipe.ingredient_rows.length > 0) {
      return recipe.ingredient_rows.map((row: DbIngredient) => {
        const unitDisplay = row.preset_units
          ? (locale === "th" ? row.preset_units.unit_name_th : row.preset_units.unit_name_en)
          : "";
        return {
          id: uid(),
          name: row.preset_ingredients?.name_th ?? "",
          amount: row.ingredient_amount,
          unitId: row.ingredient_unit_id,
          unitFlex: "",
          unitDisplay,
        };
      });
    }
    // New recipe or recipe with no rows yet — start with one empty row
    return [{ id: uid(), name: "", amount: "", unitId: null, unitFlex: "", unitDisplay: "" }];
  });
  const [instructionSteps, setInstructionSteps] = useState<InstructionStep[]>(
    () => parseInstructions(recipe?.instructions ?? "")
  );

  const [form, setForm] = useState({
    title: recipe?.title ?? "",
    description: recipe?.description ?? "",
    category_id: recipe?.category_id ?? "",
    cook_time_minutes: recipe?.cook_time_minutes?.toString() ?? "",
    servings: recipe?.servings?.toString() ?? "",
    is_public: recipe?.is_public ?? false,
    // youtube_url: prefer top-level column, fall back to legacy instructions JSON
    recipe_youtube: recipe?.youtube_url ?? extractRecipeYoutube(recipe?.instructions ?? ""),
  });

  // Locale-mapped options for comboboxes — only active presets shown
  const presetUnitOptions = [...presetUnits]
    .filter(u => u.is_active)
    .sort((a, b) => {
      const aName = locale === "th" ? a.unit_name_th : (a.unit_name_en || a.unit_name_th);
      const bName = locale === "th" ? b.unit_name_th : (b.unit_name_en || b.unit_name_th);
      return aName.localeCompare(bName, locale === "th" ? "th" : "en");
    })
    .map(u => locale === "th" ? u.unit_name_th : (u.unit_name_en || u.unit_name_th));

  const categoryOptions = [...presetCategories]
    .filter(c => c.is_active)
    .sort((a, b) => {
      const aName = locale === "th" ? a.name_th : (a.name_en || a.name_th);
      const bName = locale === "th" ? b.name_th : (b.name_en || b.name_th);
      return aName.localeCompare(bName, locale === "th" ? "th" : "en");
    })
    .map(c => locale === "th" ? c.name_th : (c.name_en || c.name_th));

  const categoryDisplay = (id: string) => {
    const cat = presetCategories.find(c => c.id === id);
    if (!cat) return "";
    return locale === "th" ? cat.name_th : (cat.name_en || cat.name_th);
  };

  const handleCategoryChange = (display: string) => {
    const cat = presetCategories.find(c =>
      (locale === "th" ? c.name_th : (c.name_en || c.name_th)) === display
    );
    setForm(p => ({ ...p, category_id: cat ? cat.id : "" }));
  };

  function addRow() { setIngredientRows(r => [...r, { id: uid(), name: "", amount: "", unitId: null, unitFlex: "", unitDisplay: "" }]); }
  function removeRow(i: number) { setIngredientRows(r => r.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: "amount" | "name", value: string) {
    setIngredientRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }
  function updateRowUnit(i: number, displayValue: string) {
    const matched = presetUnits.find(u =>
      (locale === "th" ? u.unit_name_th : u.unit_name_en) === displayValue
    );
    setIngredientRows(r => r.map((row, idx) => idx === i ? {
      ...row,
      unitId: matched ? matched.id : null,
      unitFlex: matched ? "" : displayValue,
      unitDisplay: displayValue,
    } : row));
  }
  function addStep() { setInstructionSteps(s => [...s, { id: uid(), text: "", image_url: null }]); }
  function removeStep(i: number) { setInstructionSteps(s => s.filter((_, idx) => idx !== i)); }
  function updateStep(i: number, field: keyof Omit<InstructionStep, "id">, value: string | null) {
    setInstructionSteps(s => s.map((step, idx) => idx === i ? { ...step, [field]: value } : step));
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validRows = ingredientRows.filter(row => row.name.trim());

    const validSteps = instructionSteps.filter(s => s.text.trim());
    if (!form.title.trim() || validRows.length === 0 || validSteps.length === 0) {
      toast.error(r.requiredError);
      return;
    }

    if (!isEdit && !bookId) { toast.error("missing book_id"); return; }

    const instructionsJson = JSON.stringify(
      validSteps.map(s => ({
        text: s.text.trim(),
        ...(s.image_url ? { image_url: s.image_url } : {}),
      }))
    );

    const structuredRows = validRows.map(row => ({
      name: row.name.trim(),
      amount: row.amount.trim(),
      unitId: row.unitId,
      unitFlex: row.unitId ? "" : (row.unitFlex || row.unitDisplay),
    }));

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      ingredientRows: structuredRows,
      instructions: instructionsJson,
      category_id: form.category_id || null,
      cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      image_url: imageUrl,
      youtube_url: form.recipe_youtube.trim() || null,
      is_public: form.is_public,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateRecipe(recipe.id, basePayload)
        : await createRecipe({ ...basePayload, book_id: bookId! });

      if ("error" in res) { toast.error(res.error); return; }

      toast.success(isEdit ? r.editSuccess : r.addSuccess);
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
      toast.success(r.deleteSuccess);
      if (onDeleted) onDeleted(); else router.push("/");
    });
  }

  const inputCls = "w-full border border-outline rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground placeholder:text-muted";
  const labelCls = "block text-sm font-medium text-secondary mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inModal
          ? "bg-surface rounded-b-2xl border border-border border-t-0 shadow-xl overflow-hidden"
          : "bg-surface rounded-2xl border border-border shadow-sm"
      }
    >
      <div className={inModal ? "p-6 space-y-5 max-h-[calc(100vh-10rem)] overflow-y-auto" : "p-6 space-y-5"}>

        <ImageUpload value={imageUrl} onChange={setImageUrl} />

        <div>
          <label className={labelCls}>{r.titleLabel} <span className="text-red-400">*</span></label>
          <input value={form.title} onChange={set("title")} placeholder={r.titlePlaceholder} className={inputCls} required />
        </div>

        <div>
          <label className={labelCls}>{r.descLabel}</label>
          <textarea value={form.description} onChange={set("description")} rows={2} placeholder={r.descLabel} className={inputCls + " resize-none"} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>{r.categoryLabel}</label>
            {presetCategories.length === 0 ? (
              <input
                disabled
                value=""
                placeholder={r.categoryNoOptions}
                className={`${inputCls} opacity-50 cursor-not-allowed`}
              />
            ) : (
              <Combobox
                value={categoryDisplay(form.category_id)}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder={r.categoryPlaceholder}
                className={inputCls}
              />
            )}
          </div>
          <div>
            <label className={labelCls}>{r.cookTimeLabel}</label>
            <input type="number" min="1" value={form.cook_time_minutes} onChange={set("cook_time_minutes")} placeholder="30" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{r.servingsLabel}</label>
            <input type="number" min="1" value={form.servings} onChange={set("servings")} placeholder="1" className={inputCls} />
          </div>
        </div>

        {/* ── Ingredients ─────────────────────────────────── */}
        <div>
          <label className={labelCls}>{r.ingredientsLabel} <span className="text-red-400">*</span></label>

          {/* Column headers — desktop only */}
          <div className="hidden sm:grid gap-2 mb-1.5 px-0.5" style={{ gridTemplateColumns: "1.25rem 1fr 5.5rem 8.5rem 2rem" }}>
            <span />
            <span className="text-xs text-muted">{r.ingredientName}</span>
            <span className="text-xs text-muted">{r.ingredientAmount}</span>
            <span className="text-xs text-muted">{r.ingredientUnit}</span>
            <span />
          </div>

          <ReactSortable
            list={ingredientRows}
            setList={setIngredientRows}
            handle=".ing-drag-handle"
            animation={150}
            ghostClass="opacity-40"
            className="space-y-2"
          >
            {ingredientRows.map((row, i) => (
              <div key={row.id}>
                {/* Mobile */}
                <div className="sm:hidden flex items-start gap-2">
                  <div className="mt-[1.85rem] shrink-0">
                    <GripVertical className="ing-drag-handle w-4 h-4 text-muted cursor-grab active:cursor-grabbing touch-none" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div>
                      <p className="text-[10px] font-medium text-muted mb-1">{r.ingredientName}</p>
                      <Combobox value={row.name} onChange={v => updateRow(i, "name", v)}
                        options={ingredientNameOptions} placeholder={r.ingredientName} className={inputCls} wrapperClass="w-full" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-[4.5rem] shrink-0">
                        <p className="text-[10px] font-medium text-muted mb-1">{r.ingredientAmount}</p>
                        <input value={row.amount} onChange={e => updateRow(i, "amount", e.target.value)}
                          placeholder="0" className={inputCls} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted mb-1">{r.ingredientUnit}</p>
                        <Combobox value={row.unitDisplay} onChange={v => updateRowUnit(i, v)} options={presetUnitOptions} placeholder={r.unspecifiedUnit} className={inputCls} wrapperClass="w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-[1.85rem] shrink-0">
                    <button type="button" onClick={() => removeRow(i)} disabled={ingredientRows.length === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:invisible">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Desktop */}
                <div className="hidden sm:grid gap-2 items-center" style={{ gridTemplateColumns: "1.25rem 1fr 5.5rem 8.5rem 2rem" }}>
                  <GripVertical className="ing-drag-handle w-4 h-4 text-muted cursor-grab active:cursor-grabbing touch-none" />
                  <Combobox value={row.name} onChange={v => updateRow(i, "name", v)}
                    options={ingredientNameOptions} placeholder={r.ingredientName} className={inputCls} />
                  <input value={row.amount} onChange={e => updateRow(i, "amount", e.target.value)}
                    placeholder="0" className={inputCls} />
                  <Combobox value={row.unitDisplay} onChange={v => updateRowUnit(i, v)} options={presetUnitOptions} placeholder={r.unspecifiedUnit} className={inputCls} />
                  <button type="button" onClick={() => removeRow(i)} disabled={ingredientRows.length === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:invisible">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </ReactSortable>

          <button type="button" onClick={addRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
            <Plus className="w-4 h-4" />
            {r.addIngredient}
          </button>
        </div>

        {/* ── Instructions ────────────────────────────────── */}
        <div>
          <label className={labelCls}>{r.instructionsLabel} <span className="text-red-400">*</span></label>
          <ReactSortable
            list={instructionSteps}
            setList={setInstructionSteps}
            handle=".step-drag-handle"
            animation={150}
            ghostClass="opacity-40"
            className="space-y-2.5"
          >
            {instructionSteps.map((step, i) => (
              <div key={step.id} className="border border-outline rounded-xl overflow-hidden bg-surface">
                {/* Step header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-elevated border-b border-border">
                  <GripVertical className="step-drag-handle w-4 h-4 text-muted cursor-grab active:cursor-grabbing shrink-0 touch-none" />
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted flex-1">{r.stepLabel} {i + 1}</span>
                  <button type="button" onClick={() => removeStep(i)} disabled={instructionSteps.length === 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:invisible">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Step text */}
                <textarea value={step.text} onChange={e => updateStep(i, "text", e.target.value)}
                  placeholder={r.stepPlaceholder.replace("{n}", String(i + 1))} rows={2}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none bg-surface text-foreground placeholder:text-muted border-0" />
                {/* Step image */}
                <StepImageUpload
                  value={step.image_url}
                  onChange={url => updateStep(i, "image_url", url)}
                />
              </div>
            ))}
          </ReactSortable>
          <button type="button" onClick={addStep}
            className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
            <Plus className="w-4 h-4" />
            {r.addStep}
          </button>
        </div>

        {/* ── Recipe-level YouTube ─────────────────────────── */}
        <div>
          <label className={labelCls}>{r.youtubeLabel}</label>
          <div className="border border-outline rounded-xl overflow-hidden bg-surface">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-elevated/60">
              <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center shrink-0">
                <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "7px solid white", marginLeft: 1 }} />
              </div>
              <input
                value={form.recipe_youtube}
                onChange={set("recipe_youtube")}
                placeholder={r.youtubePlaceholder}
                className="flex-1 text-sm bg-transparent focus:outline-none text-secondary placeholder:text-muted"
              />
              {form.recipe_youtube && (
                <button type="button" onClick={() => setForm(p => ({ ...p, recipe_youtube: "" }))}
                  className="text-muted hover:text-secondary transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <YtPreview url={form.recipe_youtube} />
          </div>
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input type="checkbox" checked={form.is_public}
              onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
              className="sr-only peer" />
            <div className="w-10 h-6 bg-stone-200 dark:bg-stone-700 rounded-full peer peer-checked:bg-orange-500 transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-stone-300 rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-secondary">{r.publicToggle}</span>
        </label>

        <div className="flex gap-3 pt-2">
          {showDelete && isEdit && (
            confirmDelete ? (
              <LoadingButton type="button" onClick={handleDelete} pending={isPending} pendingLabel={t.common.saving} variant="danger">
                {t.common.confirm}
              </LoadingButton>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl px-3.5 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center transition-colors"
                title={r.deleteBtn}>
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
          <button type="button"
            onClick={() => confirmDelete ? setConfirmDelete(false) : cancel()}
            className="flex-1 border border-outline text-secondary rounded-xl py-2.5 text-sm hover:bg-elevated transition-colors">
            {confirmDelete ? r.cancelDelete : t.common.cancel}
          </button>
          {!confirmDelete && (
            <LoadingButton type="submit" pending={isPending} pendingLabel={t.common.saving} className="flex-1">
              {isEdit ? r.saveEdit : r.saveNew}
            </LoadingButton>
          )}
        </div>

      </div>
    </form>
  );
}
