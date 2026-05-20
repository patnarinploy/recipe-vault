"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Check, X, Pencil, EyeOff, Eye, Layers } from "lucide-react";
import {
  createPresetUnit, updatePresetUnit, setPresetUnitActive,
  createPresetCategory, updatePresetCategory, setPresetCategoryActive,
} from "@/app/actions/user-presets";
import type { PresetCategory, PresetUnit } from "@/lib/types";
import { useLocale } from "@/lib/locale";

type Tab = "units" | "categories";
type EditState = { id: string; nameTh: string; nameEn: string };

function PresetsTable({
  items,
  onSaveEdit,
  onArchive,
  onAdd,
  thLabel,
  enLabel,
  addLabel,
  archiveConfirm,
  restoreConfirm,
  countLabel,
  archiveLabel,
  restoreLabel,
  archivedLabel,
  emptyLabel,
}: {
  items: { id: string; nameTh: string; nameEn: string; isActive: boolean }[];
  onSaveEdit: (id: string, nameTh: string, nameEn: string) => Promise<void>;
  onArchive: (id: string, newActive: boolean) => Promise<void>;
  onAdd: (nameTh: string, nameEn: string) => Promise<void>;
  thLabel: string;
  enLabel: string;
  addLabel: string;
  archiveConfirm: string;
  restoreConfirm: string;
  countLabel: string;
  archiveLabel: string;
  restoreLabel: string;
  archivedLabel: string;
  emptyLabel: string;
}) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ nameTh: "", nameEn: "" });
  const [pending, startTransition] = useTransition();

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.nameTh.trim()) { toast.error("กรุณากรอกชื่อภาษาไทย"); return; }
    startTransition(async () => {
      await onSaveEdit(editing.id, editing.nameTh.trim(), editing.nameEn.trim());
      setEditing(null);
    });
  };

  const handleArchive = (id: string, currentlyActive: boolean) => {
    if (!confirm(currentlyActive ? archiveConfirm : restoreConfirm)) return;
    startTransition(async () => { await onArchive(id, !currentlyActive); });
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
        {items.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{thLabel}</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{enLabel}</span>
            <span />
          </div>
        )}

        {items.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted">
            <Layers className="w-8 h-8 opacity-30" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        )}

        {items.map(item => (
          <div key={item.id}
               className={`grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-elevated/50 transition-colors ${!item.isActive ? "opacity-50" : ""}`}>
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-foreground truncate">{item.nameTh}</span>
                  {!item.isActive && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">
                      {archivedLabel}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted truncate">
                  {item.nameEn || <span className="italic text-muted/50">—</span>}
                </span>
                <div className="flex gap-1 justify-end">
                  {item.isActive && (
                    <button onClick={() => setEditing({ id: item.id, nameTh: item.nameTh, nameEn: item.nameEn })}
                            className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleArchive(item.id, item.isActive)} disabled={pending}
                          title={item.isActive ? archiveLabel : restoreLabel}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            item.isActive
                              ? "text-muted hover:bg-elevated hover:text-orange-500"
                              : "text-muted hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                          }`}>
                    {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 bg-orange-50/50 dark:bg-orange-900/10 border-t border-border">
            <input value={newRow.nameTh} onChange={e => setNewRow(v => ({ ...v, nameTh: e.target.value }))}
              placeholder={thLabel}
              className="border border-orange-300 rounded-lg px-2 py-1 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              autoFocus onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
            <input value={newRow.nameEn} onChange={e => setNewRow(v => ({ ...v, nameEn: e.target.value }))}
              placeholder={enLabel}
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

export default function UserDropdownsClient({
  units: initialUnits,
  categories: initialCategories,
}: {
  units: PresetUnit[];
  categories: PresetCategory[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const d = t.settings.dropdowns;

  const [activeTab, setActiveTab] = useState<Tab>("units");
  const [units, setUnits] = useState(() =>
    [...initialUnits].sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
  );
  const [categories, setCategories] = useState(() =>
    [...initialCategories].sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
  );

  const unitItems = units.map(u => ({ id: u.id, nameTh: u.unit_name_th, nameEn: u.unit_name_en, isActive: u.is_active }));
  const categoryItems = categories.map(c => ({ id: c.id, nameTh: c.name_th, nameEn: c.name_en, isActive: c.is_active }));

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

  const archiveUnit = async (id: string, newActive: boolean) => {
    const res = await setPresetUnitActive(id, newActive);
    if ("error" in res) { toast.error(res.error); return; }
    setUnits(prev => prev.map(u => u.id === id ? { ...u, is_active: newActive } : u));
    toast.success(newActive ? "คืนค่าแล้ว" : "ซ่อนแล้ว");
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

  const archiveCategory = async (id: string, newActive: boolean) => {
    const res = await setPresetCategoryActive(id, newActive);
    if ("error" in res) { toast.error(res.error); return; }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: newActive } : c));
    toast.success(newActive ? "คืนค่าแล้ว" : "ซ่อนแล้ว");
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
      <div className="flex gap-1 border-b border-border">
        {(["units", "categories"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab ? "text-orange-500" : "text-muted hover:text-foreground"
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
          onArchive={archiveUnit}
          onAdd={addUnit}
          thLabel={d.nameTh}
          enLabel={d.nameEn}
          addLabel={d.addUnit}
          archiveConfirm={d.deleteUnitConfirm}
          restoreConfirm={d.restoreUnitConfirm}
          countLabel={d.countUnits.replace("{n}", String(units.length))}
          archiveLabel={d.archive}
          restoreLabel={d.restore}
          archivedLabel={d.archived}
          emptyLabel={d.emptyUnits}
        />
      )}

      {activeTab === "categories" && (
        <PresetsTable
          items={categoryItems}
          onSaveEdit={saveCategory}
          onArchive={archiveCategory}
          onAdd={addCategory}
          thLabel={d.nameTh}
          enLabel={d.nameEn}
          addLabel={d.addCategory}
          archiveConfirm={d.deleteCategoryConfirm}
          restoreConfirm={d.restoreCategoryConfirm}
          countLabel={d.countCategories.replace("{n}", String(categories.length))}
          archiveLabel={d.archive}
          restoreLabel={d.restore}
          archivedLabel={d.archived}
          emptyLabel={d.emptyCategories}
        />
      )}
    </div>
  );
}
