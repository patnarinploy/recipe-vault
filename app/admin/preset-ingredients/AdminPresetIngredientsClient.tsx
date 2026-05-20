"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, X, Pencil, GripVertical, Search } from "lucide-react";
import { createPresetIngredient, updatePresetIngredient, deletePresetIngredient } from "@/app/actions/admin-presets";
import type { PresetIngredient } from "@/lib/types";

interface EditState {
  id: string;
  name_th: string;
  name_en: string;
  sort_order: number;
}

interface NewState {
  name_th: string;
  name_en: string;
}

export default function AdminPresetIngredientsClient({ items: initial }: { items: PresetIngredient[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<NewState>({ name_th: "", name_en: "" });
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = query.trim()
    ? items.filter(i =>
        i.name_th.toLowerCase().includes(query.toLowerCase()) ||
        (i.name_en ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const startEdit = (i: PresetIngredient) =>
    setEditing({ id: i.id, name_th: i.name_th, name_en: i.name_en ?? "", sort_order: i.sort_order });

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.name_th.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      const res = await updatePresetIngredient(editing.id, {
        name_th: editing.name_th.trim(),
        name_en: editing.name_en.trim() || null,
        sort_order: editing.sort_order,
      });
      if ("error" in res) { toast.error(res.error); return; }
      setItems(prev => prev.map(i => i.id === editing.id
        ? { ...i, name_th: editing.name_th.trim(), name_en: editing.name_en.trim() || null, sort_order: editing.sort_order }
        : i));
      setEditing(null);
      toast.success("บันทึกแล้ว");
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("ลบวัตถุดิบ Preset นี้?")) return;
    startTransition(async () => {
      const res = await deletePresetIngredient(id);
      if ("error" in res) { toast.error(res.error); return; }
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("ลบแล้ว");
      router.refresh();
    });
  };

  const saveNew = () => {
    if (!newRow.name_th.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    const nextSort = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
    startTransition(async () => {
      const res = await createPresetIngredient({
        name_th: newRow.name_th.trim(),
        name_en: newRow.name_en.trim() || null,
        sort_order: nextSort,
      });
      if ("error" in res) { toast.error(res.error); return; }
      setItems(prev => [...prev, res as PresetIngredient]);
      setNewRow({ name_th: "", name_en: "" });
      setAdding(false);
      toast.success("เพิ่มวัตถุดิบแล้ว");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหาวัตถุดิบ…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_4rem_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">ภาษาไทย</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">English</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest text-center">Sort</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {query ? "ไม่พบวัตถุดิบที่ค้นหา" : "ยังไม่มีวัตถุดิบ Preset"}
          </div>
        )}

        {filtered.map(item => (
          <div key={item.id}
               className="grid grid-cols-[1fr_1fr_4rem_5rem] gap-3 items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-elevated/50 transition-colors">
            {editing?.id === item.id ? (
              <>
                <input
                  value={editing.name_th}
                  onChange={e => setEditing(v => v && ({ ...v, name_th: e.target.value }))}
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                  autoFocus
                />
                <input
                  value={editing.name_en}
                  onChange={e => setEditing(v => v && ({ ...v, name_en: e.target.value }))}
                  placeholder="optional"
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={e => setEditing(v => v && ({ ...v, sort_order: parseInt(e.target.value) || 0 }))}
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground text-center focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={saveEdit} disabled={pending}
                          className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit}
                          className="p-1.5 rounded-lg text-muted hover:bg-elevated transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-foreground">{item.name_th}</span>
                <span className="text-sm text-muted">{item.name_en || <span className="italic text-muted/50">—</span>}</span>
                <span className="text-sm text-muted text-center">{item.sort_order}</span>
                <div className="flex gap-1 justify-end">
                  <button onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={pending}
                          className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="grid grid-cols-[1fr_1fr_4rem_5rem] gap-3 items-center px-4 py-2.5 border-b border-border bg-orange-50/50 dark:bg-orange-900/10">
            <input
              value={newRow.name_th}
              onChange={e => setNewRow(v => ({ ...v, name_th: e.target.value }))}
              placeholder="เช่น เนื้อวัว"
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }}
            />
            <input
              value={newRow.name_en}
              onChange={e => setNewRow(v => ({ ...v, name_en: e.target.value }))}
              placeholder="e.g. beef (optional)"
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }}
            />
            <span />
            <div className="flex gap-1 justify-end">
              <button onClick={saveNew} disabled={pending}
                      className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setAdding(false); setNewRow({ name_th: "", name_en: "" }); }}
                      className="p-1.5 rounded-lg text-muted hover:bg-elevated transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!adding && (
        <button onClick={() => setAdding(true)}
                className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
          <Plus className="w-4 h-4" />
          เพิ่มวัตถุดิบ
        </button>
      )}

      <p className="text-xs text-muted">
        มี {items.length} วัตถุดิบ Preset · ข้อมูลจะปรากฏเป็น Dropdown Suggestion เมื่อเพิ่มสูตรอาหาร
      </p>
    </div>
  );
}
