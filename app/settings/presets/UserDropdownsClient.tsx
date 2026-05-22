"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Check, Pencil, EyeOff, Eye, Layers, ChevronDown, ChevronUp, Search, Trash2, ExternalLink, Info } from "lucide-react";
import PresetDetailModal from "@/components/PresetDetailModal";
import type { IngredientDetailProps, UnitDetailProps, CategoryDetailProps, StoreDetailProps } from "@/components/PresetDetailModal";
import {
  createPresetUnit, updatePresetUnit, setPresetUnitActive,
  createPresetCategory, updatePresetCategory, setPresetCategoryActive,
  createPresetIngredient, updatePresetIngredient, setPresetIngredientActive,
} from "@/app/actions/user-presets";
import { setIngredientStorePrefs, deleteUserStore } from "@/app/actions/stores";
import type { PresetCategory, PresetUnit, PresetIngredient, UserStore, IngredientStorePref } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import StoreFormInline from "@/components/StoreFormInline";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

type Tab = "ingredients" | "units" | "categories" | "stores";
type EditState = { id: string; nameTh: string; nameEn: string };

// ─── Module-level sub-components for IngredientsTable ────────────
// These MUST be defined outside IngredientsTable to keep stable identity
// across renders, preventing the autoFocus/remount bug.

type IngItem = {
  id: string;
  nameTh: string;
  nameEn: string;
  isActive: boolean;
  storeIds: string[];
};
type IngEditState = { id: string; nameTh: string; nameEn: string; storeIds: string[] };

function StoreChips({
  ids, muted, storeMap, noStoreLabel,
}: {
  ids: string[];
  muted?: boolean;
  storeMap: Map<string, UserStore>;
  noStoreLabel: string;
}) {
  if (ids.length === 0) {
    return muted ? <div className="text-xs text-muted italic mt-0.5 opacity-60">{noStoreLabel}</div> : null;
  }
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {ids.map(id => {
        const st = storeMap.get(id);
        if (!st) return null;
        return (
          <span key={id} className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-elevated border border-border/70">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
            <span className="text-secondary truncate max-w-[80px]">{st.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function StorePicker({
  ids, onChange, stores, noStoreLabel,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  stores: UserStore[];
  noStoreLabel: string;
}) {
  const toggleStoreId = (storeId: string, current: string[]): string[] =>
    current.includes(storeId) ? current.filter(x => x !== storeId) : [...current, storeId];

  if (stores.length === 0) {
    return <p className="text-xs text-muted italic">{noStoreLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {stores.map(st => {
        const on = ids.includes(st.id);
        return (
          <button key={st.id} type="button"
            onClick={() => onChange(toggleStoreId(st.id, ids))}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              on ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                 : "border-border bg-elevated text-muted hover:border-orange-300"
            }`}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />
            {st.name}
          </button>
        );
      })}
    </div>
  );
}

function EditForm({
  nameTh, nameEn, storeIds,
  onNameTh, onNameEn, onStores,
  onSave, onCancel,
  thLabel, enLabel, storesLabel, noStoreLabel,
  stores, storeMap, pending,
}: {
  nameTh: string; nameEn: string; storeIds: string[];
  onNameTh: (v: string) => void; onNameEn: (v: string) => void;
  onStores: (ids: string[]) => void;
  onSave: () => void; onCancel: () => void;
  thLabel: string; enLabel: string; storesLabel: string; noStoreLabel: string;
  stores: UserStore[]; storeMap: Map<string, UserStore>; pending: boolean;
}) {
  void storeMap; // used by StorePicker indirectly via stores prop
  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10 border-t border-border">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{thLabel}</label>
          <input value={nameTh} onChange={e => onNameTh(e.target.value)} placeholder={thLabel}
            className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{enLabel}</label>
          <input value={nameEn} onChange={e => onNameEn(e.target.value)} placeholder={enLabel}
            className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
            onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} />
        </div>
      </div>
      {stores.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{storesLabel}</label>
          <StorePicker ids={storeIds} onChange={onStores} stores={stores} noStoreLabel={noStoreLabel} />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors">
          ยกเลิก
        </button>
        <button onClick={onSave} disabled={pending}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
          <Check className="w-4 h-4" /> บันทึก
        </button>
      </div>
    </div>
  );
}

// ─── PresetsTable ─────────────────────────────────────────────────

function PresetsTable({
  kind,
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
  requireOneNameError,
}: {
  kind: "unit" | "category";
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
  requireOneNameError: string;
}) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ nameTh: "", nameEn: "" });
  const [pending, startTransition] = useTransition();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<UnitDetailProps | CategoryDetailProps | null>(null);
  const { locale } = useLocale();

  const [col1Label, col2Label] = locale === "en" ? [enLabel, thLabel] : [thLabel, enLabel];
  const primaryName  = (it: { nameTh: string; nameEn: string }) =>
    locale === "en" ? (it.nameEn || it.nameTh) : (it.nameTh || it.nameEn);
  const secondaryName = (it: { nameTh: string; nameEn: string }) =>
    locale === "en" ? it.nameTh : it.nameEn;

  const q = search.toLowerCase();
  const filterItem = (it: { nameTh: string; nameEn: string }) =>
    !q || it.nameTh.toLowerCase().includes(q) || it.nameEn.toLowerCase().includes(q);

  const activeItems = items.filter(i => i.isActive && filterItem(i));
  const archivedItems = items.filter(i => !i.isActive && filterItem(i));

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.nameTh.trim() && !editing.nameEn.trim()) { toast.error(requireOneNameError); return; }
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
    if (!newRow.nameTh.trim() && !newRow.nameEn.trim()) { toast.error(requireOneNameError); return; }
    startTransition(async () => {
      await onAdd(newRow.nameTh.trim(), newRow.nameEn.trim());
      setNewRow({ nameTh: "", nameEn: "" });
      setAdding(false);
    });
  };

  const renderItem = (item: { id: string; nameTh: string; nameEn: string; isActive: boolean }) => (
    <div key={item.id} className="border-b border-border last:border-0">
      {editing?.id === item.id ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
          style={{ overflow: "hidden" }}
        >
          <div className="flex flex-col gap-2 px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{thLabel}</label>
              <input value={editing.nameTh}
                onChange={e => setEditing(v => v && ({ ...v, nameTh: e.target.value }))}
                placeholder={thLabel}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                autoFocus onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{enLabel}</label>
              <input value={editing.nameEn}
                onChange={e => setEditing(v => v && ({ ...v, nameEn: e.target.value }))}
                placeholder={enLabel}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors">
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={pending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" /> บันทึก
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className={`flex items-center gap-2 px-4 py-2.5 hover:bg-elevated/50 transition-colors ${!item.isActive ? "opacity-50" : ""}`}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <div className="sm:flex-1 min-w-0 flex items-center gap-2">
                <span className="text-sm text-foreground truncate">{primaryName(item)}</span>
                {!item.isActive && (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">
                    {archivedLabel}
                  </span>
                )}
              </div>
              <span className="sm:flex-1 text-xs sm:text-sm text-muted truncate">
                {secondaryName(item) || <span className="hidden sm:inline italic text-muted/50">—</span>}
              </span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setDetail({ kind, id: item.id, nameTh: item.nameTh, nameEn: item.nameEn, onClose: () => setDetail(null) } as UnitDetailProps | CategoryDetailProps)}
                    className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
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
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{countLabel}</p>
      {/* Search + Add row */}
      <div className="flex items-center gap-2 -mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={col1Label + " / " + col2Label}
            className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            {addLabel}
          </button>
        )}
      </div>

      {/* Add form at top when open */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            style={{ overflow: "hidden" }}
          >
            <div className="bg-surface rounded-2xl border border-border overflow-hidden mb-0">
              <div className="flex flex-col gap-2 px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted">{thLabel}</label>
                  <input value={newRow.nameTh} onChange={e => setNewRow(v => ({ ...v, nameTh: e.target.value }))}
                    placeholder={thLabel}
                    className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                    autoFocus onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted">{enLabel}</label>
                  <input value={newRow.nameEn} onChange={e => setNewRow(v => ({ ...v, nameEn: e.target.value }))}
                    placeholder={enLabel}
                    className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
                    onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAdding(false); }} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setAdding(false); setNewRow({ nameTh: "", nameEn: "" }); }}
                          className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors">
                    ยกเลิก
                  </button>
                  <button onClick={saveNew} disabled={pending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <Check className="w-4 h-4" /> บันทึก
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {activeItems.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{col1Label}</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{col2Label}</span>
            <span />
          </div>
        )}

        {activeItems.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted">
            <Layers className="w-8 h-8 opacity-30" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        )}

        {activeItems.map(renderItem)}

        {/* Archived section */}
        {archivedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted hover:text-foreground hover:bg-elevated/50 transition-colors border-t border-border"
            >
              {showArchived ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              ซ่อนอยู่ ({archivedItems.length})
            </button>
            {showArchived && archivedItems.map(renderItem)}
          </>
        )}
      </div>

      <p className="text-xs text-muted">{countLabel}</p>
      {detail && <PresetDetailModal {...detail} />}
    </div>
  );
}

// ─── IngredientsTable ─────────────────────────────────────────────

function IngredientsTable({
  items, stores,
  onSaveEdit, onArchive, onAdd,
  thLabel, enLabel, addLabel,
  archiveConfirm, restoreConfirm,
  countLabel, archiveLabel, restoreLabel, archivedLabel, emptyLabel,
  storesLabel, noStoreLabel, requireOneNameError,
}: {
  items: IngItem[];
  stores: UserStore[];
  onSaveEdit: (id: string, nameTh: string, nameEn: string, storeIds: string[]) => Promise<void>;
  onArchive: (id: string, newActive: boolean) => Promise<void>;
  onAdd: (nameTh: string, nameEn: string, storeIds: string[]) => Promise<void>;
  thLabel: string; enLabel: string; addLabel: string;
  archiveConfirm: string; restoreConfirm: string;
  countLabel: string; archiveLabel: string; restoreLabel: string;
  archivedLabel: string; emptyLabel: string;
  storesLabel: string; noStoreLabel: string;
  requireOneNameError: string;
}) {
  const [editing, setEditing] = useState<IngEditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ nameTh: "", nameEn: "", storeIds: [] as string[] });
  const [pending, startTransition] = useTransition();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<IngredientDetailProps | null>(null);
  const { locale } = useLocale();

  const storeMap = new Map(stores.map(s => [s.id, s]));

  const [col1Label, col2Label] = locale === "en" ? [enLabel, thLabel] : [thLabel, enLabel];
  const primaryName = (it: IngItem) =>
    locale === "en" ? (it.nameEn || it.nameTh) : (it.nameTh || it.nameEn);
  const secondaryName = (it: IngItem) =>
    locale === "en" ? it.nameTh : it.nameEn;

  const q = search.toLowerCase();
  const filterItem = (it: IngItem) =>
    !q || it.nameTh.toLowerCase().includes(q) || it.nameEn.toLowerCase().includes(q);

  const activeItems = items.filter(i => i.isActive && filterItem(i));
  const archivedItems = items.filter(i => !i.isActive && filterItem(i));

  const saveEdit = () => {
    if (!editing || (!editing.nameTh.trim() && !editing.nameEn.trim())) { toast.error(requireOneNameError); return; }
    startTransition(async () => {
      await onSaveEdit(editing.id, editing.nameTh.trim(), editing.nameEn.trim(), editing.storeIds);
      setEditing(null);
    });
  };

  const handleArchive = (id: string, active: boolean) => {
    if (!confirm(active ? archiveConfirm : restoreConfirm)) return;
    startTransition(async () => { await onArchive(id, !active); });
  };

  const saveNew = () => {
    if (!newRow.nameTh.trim() && !newRow.nameEn.trim()) { toast.error(requireOneNameError); return; }
    startTransition(async () => {
      await onAdd(newRow.nameTh.trim(), newRow.nameEn.trim(), newRow.storeIds);
      setNewRow({ nameTh: "", nameEn: "", storeIds: [] });
      setAdding(false);
    });
  };

  const renderItem = (item: IngItem) => (
    <div key={item.id} className="border-b border-border last:border-0">
      {editing?.id === item.id ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
          style={{ overflow: "hidden" }}
        >
          <EditForm
            nameTh={editing.nameTh} nameEn={editing.nameEn} storeIds={editing.storeIds}
            onNameTh={v => setEditing(e => e && ({ ...e, nameTh: v }))}
            onNameEn={v => setEditing(e => e && ({ ...e, nameEn: v }))}
            onStores={ids => setEditing(e => e && ({ ...e, storeIds: ids }))}
            onSave={saveEdit} onCancel={() => setEditing(null)}
            thLabel={thLabel} enLabel={enLabel} storesLabel={storesLabel} noStoreLabel={noStoreLabel}
            stores={stores} storeMap={storeMap} pending={pending}
          />
        </motion.div>
      ) : (
        <div className={`flex items-start gap-2 px-4 py-2.5 hover:bg-elevated/50 transition-colors ${!item.isActive ? "opacity-50" : ""}`}>
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
              <div className="sm:flex-1 min-w-0">
                <span className="text-sm text-foreground">{primaryName(item)}</span>
                {!item.isActive && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">
                    {archivedLabel}
                  </span>
                )}
              </div>
              <span className="sm:flex-1 text-xs sm:text-sm text-muted truncate mt-0.5 sm:mt-0">
                {secondaryName(item) || <span className="hidden sm:inline italic text-muted/50">—</span>}
              </span>
            </div>
            <StoreChips ids={item.storeIds} muted storeMap={storeMap} noStoreLabel={noStoreLabel} />
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setDetail({ kind: "ingredient", id: item.id, nameTh: item.nameTh, nameEn: item.nameEn, storeIds: item.storeIds, storeMap, onClose: () => setDetail(null) })}
              className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
            {item.isActive && (
              <button onClick={() => setEditing({ id: item.id, nameTh: item.nameTh, nameEn: item.nameEn, storeIds: item.storeIds })}
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
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{countLabel}</p>
      {/* Search + Add row */}
      <div className="flex items-center gap-2 -mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={col1Label + " / " + col2Label}
            className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            {addLabel}
          </button>
        )}
      </div>

      {/* Add form at top when open */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            style={{ overflow: "hidden" }}
          >
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <EditForm
                nameTh={newRow.nameTh} nameEn={newRow.nameEn} storeIds={newRow.storeIds}
                onNameTh={v => setNewRow(r => ({ ...r, nameTh: v }))}
                onNameEn={v => setNewRow(r => ({ ...r, nameEn: v }))}
                onStores={ids => setNewRow(r => ({ ...r, storeIds: ids }))}
                onSave={saveNew}
                onCancel={() => { setAdding(false); setNewRow({ nameTh: "", nameEn: "", storeIds: [] }); }}
                thLabel={thLabel} enLabel={enLabel} storesLabel={storesLabel} noStoreLabel={noStoreLabel}
                stores={stores} storeMap={storeMap} pending={pending}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Column headers */}
        {(activeItems.length > 0 || archivedItems.length > 0) && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{col1Label}</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">{col2Label}</span>
            <span />
          </div>
        )}

        {activeItems.length === 0 && archivedItems.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted">
            <Layers className="w-8 h-8 opacity-30" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        )}

        {activeItems.map(renderItem)}

        {/* Archived section */}
        {archivedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted hover:text-foreground hover:bg-elevated/50 transition-colors border-t border-border"
            >
              {showArchived ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              ซ่อนอยู่ ({archivedItems.length})
            </button>
            {showArchived && archivedItems.map(renderItem)}
          </>
        )}
      </div>

      <p className="text-xs text-muted">{countLabel}</p>
      {detail && <PresetDetailModal {...detail} />}
    </div>
  );
}

// ─── StoresTable ──────────────────────────────────────────────────

function StoresTable({
  stores,
  onSave, onDelete,
  addLabel, deleteConfirm, emptyLabel, countLabel,
}: {
  stores: UserStore[];
  onSave: (saved: UserStore) => void;
  onDelete: (id: string) => Promise<void>;
  addLabel: string; deleteConfirm: string; emptyLabel: string; countLabel: string;
}) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [editingStore, setEditingStore] = useState<UserStore | null>(null);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const filteredStores = stores.filter(s => !q || s.name.toLowerCase().includes(q));

  const handleDelete = (store: UserStore) => {
    if (!confirm(deleteConfirm)) return;
    startTransition(async () => { await onDelete(store.id); });
  };

  const countText = countLabel.replace("{n}", String(stores.length));
  const [detail, setDetail] = useState<StoreDetailProps | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{countText}</p>
      {/* Search + Add row */}
      <div className="flex items-center gap-2 -mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.settings.dropdowns.storeName}
            className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>

      {/* Add form at top — only for new store, not for editing */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            style={{ overflow: "hidden" }}
          >
            <StoreFormInline
              onSave={(saved) => { onSave(saved); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {stores.some(st => st.latitude !== null) && (
        <DynamicMap stores={stores} />
      )}

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {filteredStores.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted">
            <Layers className="w-8 h-8 opacity-30" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        )}

        {filteredStores.map(store => (
          <div key={store.id} className="border-b border-border last:border-0">
            {editingStore?.id === store.id ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                style={{ overflow: "hidden" }}
              >
                <StoreFormInline
                  store={store}
                  onSave={(saved) => { onSave(saved); setEditingStore(null); }}
                  onCancel={() => setEditingStore(null)}
                />
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-elevated/50 transition-colors">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: store.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{store.name}</p>
                  {store.latitude != null && store.longitude != null ? (
                    <a href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-500 flex items-center gap-0.5 mt-0.5 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Google Maps
                    </a>
                  ) : (
                    <p className="text-xs text-muted mt-0.5">{t.shopping.noLocation}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setDetail({ kind: "store", store, onClose: () => setDetail(null) })}
                    className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setAdding(false); setEditingStore(store); }}
                    className="p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(store)} disabled={pending}
                    className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">{countText}</p>
      {detail && <PresetDetailModal {...detail} />}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────

export default function UserDropdownsClient({
  units: initialUnits,
  categories: initialCategories,
  ingredients: initialIngredients,
  stores: initialStores,
  storePrefs: initialStorePrefs,
}: {
  units: PresetUnit[];
  categories: PresetCategory[];
  ingredients: PresetIngredient[];
  stores: UserStore[];
  storePrefs: IngredientStorePref[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const d = t.settings.dropdowns;

  const [activeTab, setActiveTab] = useState<Tab>("ingredients");
  const [units, setUnits] = useState(() =>
    [...initialUnits].sort((a, b) => a.unit_name_th.localeCompare(b.unit_name_th, "th"))
  );
  const [categories, setCategories] = useState(() =>
    [...initialCategories].sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
  );
  const [ingredients, setIngredients] = useState(() =>
    [...initialIngredients].sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
  );
  const [ingStorePrefs, setIngStorePrefs] = useState<Map<string, string[]>>(() => {
    const m = new Map<string, string[]>();
    for (const p of initialStorePrefs) {
      const arr = m.get(p.preset_ingredient_id) ?? [];
      if (!arr.includes(p.store_id)) arr.push(p.store_id);
      m.set(p.preset_ingredient_id, arr);
    }
    return m;
  });

  const unitItems = units.map(u => ({ id: u.id, nameTh: u.unit_name_th, nameEn: u.unit_name_en, isActive: u.is_active }));
  const categoryItems = categories.map(c => ({ id: c.id, nameTh: c.name_th, nameEn: c.name_en, isActive: c.is_active }));
  const ingItems: IngItem[] = ingredients.map(i => ({
    id: i.id,
    nameTh: i.name_th,
    nameEn: i.name_en,
    isActive: i.is_active,
    storeIds: ingStorePrefs.get(i.id) ?? [],
  }));

  // ─── Unit handlers ───────────────────────────────────────────────

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

  // ─── Category handlers ───────────────────────────────────────────

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

  // ─── Ingredient handlers ─────────────────────────────────────────

  const saveIngredient = async (id: string, nameTh: string, nameEn: string, storeIds: string[]) => {
    const res = await updatePresetIngredient(id, { name_th: nameTh, name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }

    await setIngredientStorePrefs(id, storeIds);

    setIngredients(prev =>
      prev.map(i => i.id === id ? { ...i, name_th: nameTh, name_en: nameEn } : i)
          .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
    );
    setIngStorePrefs(prev => {
      const next = new Map(prev);
      if (storeIds.length > 0) next.set(id, storeIds);
      else next.delete(id);
      return next;
    });
    toast.success("บันทึกแล้ว");
    router.refresh();
  };

  const archiveIngredient = async (id: string, newActive: boolean) => {
    const res = await setPresetIngredientActive(id, newActive);
    if ("error" in res) { toast.error(res.error); return; }
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, is_active: newActive } : i));
    toast.success(newActive ? "คืนค่าแล้ว" : "ซ่อนแล้ว");
    router.refresh();
  };

  const addIngredient = async (nameTh: string, nameEn: string, storeIds: string[]) => {
    const res = await createPresetIngredient({ name_th: nameTh, name_en: nameEn });
    if ("error" in res) { toast.error(res.error); return; }
    const newPreset = res as PresetIngredient;
    if (storeIds.length > 0) {
      await setIngredientStorePrefs(newPreset.id, storeIds);
      setIngStorePrefs(prev => new Map(prev).set(newPreset.id, storeIds));
    }
    setIngredients(prev =>
      [...prev, newPreset].sort((a, b) => (a.name_th || a.name_en).localeCompare(b.name_th || b.name_en, "th"))
    );
    toast.success("เพิ่มวัตถุดิบแล้ว");
    router.refresh();
  };

  // ─── Store handlers ──────────────────────────────────────────────

  const [stores, setStores] = useState<UserStore[]>(initialStores);

  const handleStoreSaved = (saved: UserStore) => {
    setStores(prev => {
      const exists = prev.find(s => s.id === saved.id);
      return exists ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved];
    });
    router.refresh();
  };

  const removeStore = async (id: string) => {
    const res = await deleteUserStore(id);
    if ("error" in res) { toast.error(res.error); return; }
    setStores(prev => prev.filter(s => s.id !== id));
    toast.success("ลบร้านค้าแล้ว");
    router.refresh();
  };

  const TAB_LABELS: Record<Tab, string> = {
    ingredients: d.ingredientsTab,
    units: d.unitsTab,
    categories: d.categoriesTab,
    stores: d.storesTab,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(["ingredients", "units", "categories", "stores"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative shrink-0 ${
                    activeTab === tab ? "text-orange-500" : "text-muted hover:text-foreground"
                  }`}>
            {TAB_LABELS[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "ingredients" && (
        <IngredientsTable
          items={ingItems}
          stores={initialStores}
          onSaveEdit={saveIngredient}
          onArchive={archiveIngredient}
          onAdd={addIngredient}
          thLabel={d.nameTh}
          enLabel={d.nameEn}
          addLabel={d.addIngredient}
          archiveConfirm={d.deleteIngredientConfirm}
          restoreConfirm={d.restoreIngredientConfirm}
          countLabel={d.countIngredients.replace("{n}", String(ingredients.length))}
          archiveLabel={d.archive}
          restoreLabel={d.restore}
          archivedLabel={d.archived}
          emptyLabel={d.emptyIngredients}
          storesLabel={d.ingredientStores}
          noStoreLabel={d.noStoreAssigned}
          requireOneNameError={d.requireOneName}
        />
      )}

      {activeTab === "units" && (
        <PresetsTable
          kind="unit"
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
          requireOneNameError={d.requireOneName}
        />
      )}

      {activeTab === "categories" && (
        <PresetsTable
          kind="category"
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
          requireOneNameError={d.requireOneName}
        />
      )}

      {activeTab === "stores" && (
        <StoresTable
          stores={stores}
          onSave={handleStoreSaved}
          onDelete={removeStore}
          addLabel={d.addStore}
          deleteConfirm={d.storeDeleteConfirm}
          emptyLabel={d.emptyStores}
          countLabel={d.countStores}
        />
      )}
    </div>
  );
}
