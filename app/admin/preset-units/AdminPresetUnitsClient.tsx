"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { createPresetUnit, updatePresetUnit, deletePresetUnit } from "@/app/actions/admin-presets";
import type { PresetUnit } from "@/lib/types";

interface EditState { id: string; unit_name_th: string; unit_name_en: string; }
interface NewState  { unit_name_th: string; unit_name_en: string; }

export default function AdminPresetUnitsClient({ units: initial }: { units: PresetUnit[] }) {
  const router = useRouter();
  const [units, setUnits] = useState(() =>
    [...initial].sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
  );
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<NewState>({ unit_name_th: "", unit_name_en: "" });
  const [pending, startTransition] = useTransition();

  const startEdit = (u: PresetUnit) =>
    setEditing({ id: u.id, unit_name_th: u.unit_name_th, unit_name_en: u.unit_name_en });

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.unit_name_th.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      const res = await updatePresetUnit(editing.id, {
        unit_name_th: editing.unit_name_th.trim(),
        unit_name_en: editing.unit_name_en.trim(),
      });
      if ("error" in res) { toast.error(res.error); return; }
      setUnits(prev =>
        prev.map(u => u.id === editing.id ? { ...u, unit_name_th: editing.unit_name_th.trim(), unit_name_en: editing.unit_name_en.trim() } : u)
            .sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
      );
      setEditing(null);
      toast.success("บันทึกแล้ว");
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("ลบหน่วยนี้?")) return;
    startTransition(async () => {
      const res = await deletePresetUnit(id);
      if ("error" in res) { toast.error(res.error); return; }
      setUnits(prev => prev.filter(u => u.id !== id));
      toast.success("ลบแล้ว");
      router.refresh();
    });
  };

  const saveNew = () => {
    if (!newRow.unit_name_th.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      const res = await createPresetUnit({
        unit_name_th: newRow.unit_name_th.trim(),
        unit_name_en: newRow.unit_name_en.trim(),
        sort_order: 0,
      });
      if ("error" in res) { toast.error(res.error); return; }
      setUnits(prev =>
        [...prev, res as PresetUnit]
          .sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
      );
      setNewRow({ unit_name_th: "", unit_name_en: "" });
      setAdding(false);
      toast.success("เพิ่มหน่วยแล้ว");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">ภาษาไทย</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">English</span>
          <span />
        </div>

        {units.map(u => (
          <div key={u.id}
               className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-elevated/50 transition-colors">
            {editing?.id === u.id ? (
              <>
                <input value={editing.unit_name_th}
                  onChange={e => setEditing(v => v && ({ ...v, unit_name_th: e.target.value }))}
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                  autoFocus />
                <input value={editing.unit_name_en}
                  onChange={e => setEditing(v => v && ({ ...v, unit_name_en: e.target.value }))}
                  placeholder="optional"
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
                <div className="flex gap-1 justify-end">
                  <button onClick={saveEdit} disabled={pending}
                          className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing(null)}
                          className="p-1.5 rounded-lg text-muted hover:bg-elevated transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-foreground">{u.unit_name_th}</span>
                <span className="text-sm text-muted">{u.unit_name_en || <span className="italic text-muted/50">—</span>}</span>
                <div className="flex gap-1 justify-end">
                  <button onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} disabled={pending}
                          className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 border-b border-border bg-orange-50/50 dark:bg-orange-900/10">
            <input value={newRow.unit_name_th}
              onChange={e => setNewRow(v => ({ ...v, unit_name_th: e.target.value }))}
              placeholder="เช่น กรัม"
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
            <input value={newRow.unit_name_en}
              onChange={e => setNewRow(v => ({ ...v, unit_name_en: e.target.value }))}
              placeholder="e.g. g"
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
            <div className="flex gap-1 justify-end">
              <button onClick={saveNew} disabled={pending}
                      className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setAdding(false); setNewRow({ unit_name_th: "", unit_name_en: "" }); }}
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
          เพิ่มหน่วย
        </button>
      )}

      <p className="text-xs text-muted">มี {units.length} หน่วย · เรียงตามตัวอักษรภาษาไทย</p>
    </div>
  );
}
