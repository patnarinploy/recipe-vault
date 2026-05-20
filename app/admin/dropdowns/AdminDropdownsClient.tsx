"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import {
  createPresetUnit, updatePresetUnit, deletePresetUnit,
  createPresetCategory, updatePresetCategory, deletePresetCategory,
} from "@/app/actions/admin-presets";
import type { PresetCategory, PresetUnit } from "@/lib/types";
import { useLocale } from "@/lib/locale";

type Tab = "units" | "categories";
type EditState = { id: string; nameTh: string; nameEn: string };
type NewState  = { nameTh: string; nameEn: string };

// ── Reusable editable table ───────────────────────────────────────────────────

function PresetsTable({
  items,
  onSaveEdit,
  onDelete,
  onAdd,
  thLabel,
  enLabel,
  addLabel,
  deleteConfirm,
  countLabel,
}: {
  items: { id: string; nameTh: string; nameEn: string }[];
  onSaveEdit: (id: string, nameTh: string, nameEn: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (nameTh: string, nameEn: string) => Promise<void>;
  thLabel: string;
  enLabel: string;
  addLabel: string;
  deleteConfirm: string;
  countLabel: string;
}) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<NewState>({ nameTh: "", nameEn: "" });
  const [pending, startTransition] = useTransition();

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.nameTh.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      await onSaveEdit(editing.id, editing.nameTh.trim(), editing.nameEn.trim());
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(deleteConfirm)) return;
    startTransition(async () => { await onDelete(id); });
  };

  const saveNew = () => {
    if (!newRow.nameTh.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      await onAdd(newRow.nameTh.trim(), newRow.nameEn.trim());
      setNewRow({ nameTh: "", nameEn: "" });
      setAdding(false);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">{thLabel}</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">{enLabel}</span>
          <span />
        </div>

        {items.map(item => (
          <div key={item.id}
               className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-elevated/50 transition-colors">
            {editing?.id === item.id ? (
              <>
                <input value={editing.nameTh}
                  onChange={e => setEditing(v => v && ({ ...v, nameTh: e.target.value }))}
                  className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                  autoFocus />
                <input value={editing.nameEn}
                  onChange={e => setEditing(v => v && ({ ...v, nameEn: e.target.value }))}
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
                <span className="text-sm text-foreground">{item.nameTh}</span>
                <span className="text-sm text-muted">{item.nameEn || <span className="italic text-muted/50">—</span>}</span>
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing({ id: item.id, nameTh: item.nameTh, nameEn: item.nameEn })}
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
          <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 bg-orange-50/50 dark:bg-orange-900/10">
            <input value={newRow.nameTh} onChange={e => setNewRow(v => ({ ...v, nameTh: e.target.value }))}
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              autoFocus onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
            <input value={newRow.nameEn} onChange={e => setNewRow(v => ({ ...v, nameEn: e.target.value }))}
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
            <div className="flex gap-1 justify-end">
              <button onClick={saveNew} disabled={pending}
                      className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setAdding(false); setNewRow({ nameTh: "", nameEn: "" }); }}
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
          {addLabel}
        </button>
      )}
      <p className="text-xs text-muted">{countLabel}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDropdownsClient({
  units: initialUnits,
  categories: initialCategories,
}: {
  units: PresetUnit[];
  categories: PresetCategory[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const d = t.admin.dropdowns;

  const [activeTab, setActiveTab] = useState<Tab>("units");
  const [units, setUnits] = useState(() =>
    [...initialUnits].sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
  );
  const [categories, setCategories] = useState(() =>
    [...initialCategories].sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
  );

  // ── Units handlers ──────────────────────────────────────────────────────────
  const unitItems = units.map(u => ({ id: u.id, nameTh: u.unit_name_th, nameEn: u.unit_name_en }));

  const saveUnit = async (id: string, nameTh: string, nameEn: string) => {
    const res = await updatePresetUnit(id, { unit_name_th: nameTh, unit_name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }
    setUnits(prev =>
      prev.map(u => u.id === id ? { ...u, unit_name_th: nameTh, unit_name_en: nameEn } : u)
          .sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
    );
    toast.success("บันทึกแล้ว");
    router.refresh();
  };

  const deleteUnit = async (id: string) => {
    const res = await deletePresetUnit(id);
    if ("error" in res) { toast.error(res.error); return; }
    setUnits(prev => prev.filter(u => u.id !== id));
    toast.success("ลบแล้ว");
    router.refresh();
  };

  const addUnit = async (nameTh: string, nameEn: string) => {
    const res = await createPresetUnit({ unit_name_th: nameTh, unit_name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }
    setUnits(prev =>
      [...prev, res as PresetUnit].sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
    );
    toast.success("เพิ่มหน่วยแล้ว");
    router.refresh();
  };

  // ── Categories handlers ─────────────────────────────────────────────────────
  const categoryItems = categories.map(c => ({ id: c.id, nameTh: c.name_th, nameEn: c.name_en }));

  const saveCategory = async (id: string, nameTh: string, nameEn: string) => {
    const res = await updatePresetCategory(id, { name_th: nameTh, name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }
    setCategories(prev =>
      prev.map(c => c.id === id ? { ...c, name_th: nameTh, name_en: nameEn } : c)
          .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
    );
    toast.success("บันทึกแล้ว");
    router.refresh();
  };

  const deleteCategory = async (id: string) => {
    const res = await deletePresetCategory(id);
    if ("error" in res) { toast.error(res.error); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success("ลบแล้ว");
    router.refresh();
  };

  const addCategory = async (nameTh: string, nameEn: string) => {
    const res = await createPresetCategory({ name_th: nameTh, name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }
    setCategories(prev =>
      [...prev, res as PresetCategory].sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
    );
    toast.success("เพิ่มหมวดหมู่แล้ว");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["units", "categories"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? "text-orange-500"
                      : "text-muted hover:text-foreground"
                  }`}>
            {tab === "units" ? d.unitsTab : d.categoriesTab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "units" && (
        <PresetsTable
          items={unitItems}
          onSaveEdit={saveUnit}
          onDelete={deleteUnit}
          onAdd={addUnit}
          thLabel={d.nameTh}
          enLabel={d.nameEn}
          addLabel={d.addUnit}
          deleteConfirm={d.deleteUnitConfirm}
          countLabel={d.countUnits.replace("{n}", String(units.length))}
        />
      )}

      {activeTab === "categories" && (
        <PresetsTable
          items={categoryItems}
          onSaveEdit={saveCategory}
          onDelete={deleteCategory}
          onAdd={addCategory}
          thLabel={d.nameTh}
          enLabel={d.nameEn}
          addLabel={d.addCategory}
          deleteConfirm={d.deleteCategoryConfirm}
          countLabel={d.countCategories.replace("{n}", String(categories.length))}
        />
      )}
    </div>
  );
}
