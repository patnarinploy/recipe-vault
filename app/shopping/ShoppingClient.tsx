"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ChevronDown, ChevronUp,
  Check, MapPin, X, Pencil, Loader2, Navigation, Store, Route, ExternalLink,
} from "lucide-react";
import { removeFromShoppingList, updateShoppingQuantity, clearShoppingList } from "@/app/actions/shopping";
import { deleteUserStore } from "@/app/actions/stores";
import type { ShoppingListEntry, DbIngredient, UserStore, IngredientStorePref } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import StoreFormInline, { STORE_COLORS } from "@/components/StoreFormInline";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertDialog } from "@/components/ui/alert-dialog";

const DynamicMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

// ── Amount helpers ────────────────────────────────────────────────

function parseAmount(str: string): number | null {
  if (!str?.trim()) return null;
  const s = str.trim();
  const direct = parseFloat(s);
  if (!isNaN(direct)) return direct;
  const frac = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]);
  const mixed = s.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (mixed) return parseFloat(mixed[1]) + parseFloat(mixed[2]) / parseFloat(mixed[3]);
  return null;
}

function formatAmount(n: number): string {
  if (n === Math.floor(n)) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

// ── Combined ingredient type ──────────────────────────────────────

interface CombinedIng {
  key: string;
  presetIngredientId: string;
  name: string;
  unit: string;
  totalAmount: number | null;
  sources: { title: string; amount: string; qty: number }[];
}

function getIngredientName(ing: DbIngredient, locale: "th" | "en"): string {
  if (ing.preset_ingredients) {
    const name = locale === "en"
      ? (ing.preset_ingredients.name_en || ing.preset_ingredients.name_th)
      : ing.preset_ingredients.name_th;
    if (name) return name;
  }
  return "";
}

function buildCombined(items: ShoppingListEntry[], locale: "th" | "en"): CombinedIng[] {
  const map = new Map<string, CombinedIng>();
  for (const item of items) {
    for (const ing of item.recipe.ingredient_rows ?? []) {
      const name = getIngredientName(ing, locale);
      const presetIngredientId = ing.preset_ingredients?.id ?? "";
      const keyName = (ing.preset_ingredients?.name_th || ing.preset_ingredients?.name_en || "").toLowerCase().trim();
      const unit = ing.preset_units
        ? (locale === "th" ? ing.preset_units.unit_name_th : ing.preset_units.unit_name_en)
        : "";
      const key = `${keyName}:::${unit.toLowerCase()}`;
      const parsed = parseAmount(ing.ingredient_amount);
      const source = { title: item.recipe.title, amount: ing.ingredient_amount, qty: item.quantity };
      const existing = map.get(key);
      if (existing) {
        existing.sources.push(source);
        if (parsed !== null && existing.totalAmount !== null) {
          existing.totalAmount += parsed * item.quantity;
        } else {
          existing.totalAmount = null;
        }
      } else {
        map.set(key, { key, presetIngredientId, name, unit, totalAmount: parsed !== null ? parsed * item.quantity : null, sources: [source] });
      }
    }
  }
  return Array.from(map.values());
}

// ── Route recommendation (greedy set cover) ───────────────────────

function computeRoute(
  combined: CombinedIng[],
  storePrefs: Map<string, Set<string>>,
  stores: UserStore[],
) {
  const storeMap = new Map(stores.map(s => [s.id, s]));
  const storeToItems = new Map<string, CombinedIng[]>();
  const unassigned: CombinedIng[] = [];

  for (const c of combined) {
    const ids = storePrefs.get(c.presetIngredientId) ?? new Set<string>();
    if (ids.size === 0) { unassigned.push(c); continue; }
    for (const sid of ids) {
      if (!storeMap.has(sid)) continue; // skip stale refs to deleted stores
      if (!storeToItems.has(sid)) storeToItems.set(sid, []);
      storeToItems.get(sid)!.push(c);
    }
    if ([...ids].every(sid => !storeMap.has(sid))) unassigned.push(c);
  }

  const remaining = new Set(
    combined.filter(c => {
      const ids = storePrefs.get(c.presetIngredientId) ?? new Set<string>();
      return [...ids].some(sid => storeMap.has(sid));
    }).map(c => c.key),
  );
  const route: { store: UserStore; items: CombinedIng[] }[] = [];

  while (remaining.size > 0) {
    let bestId = "";
    let bestItems: CombinedIng[] = [];
    for (const [sid, items] of storeToItems) {
      const coverable = items.filter(c => remaining.has(c.key));
      if (coverable.length > bestItems.length) { bestId = sid; bestItems = coverable; }
    }
    if (!bestId || bestItems.length === 0) break;
    const storeObj = storeMap.get(bestId);
    if (!storeObj) break; // guard: should not happen after filtering above
    route.push({ store: storeObj, items: bestItems });
    for (const c of bestItems) remaining.delete(c.key);
  }

  return { route, unassigned };
}

// ── IngredientList (per recipe) ───────────────────────────────────

function IngredientList({ rows, locale, qty }: { rows: DbIngredient[]; locale: "th" | "en"; qty: number }) {
  const [open, setOpen] = useState(true);
  const { t } = useLocale();
  const s = t.shopping;
  return (
    <div className="border-t border-border mt-3 pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-2"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {s.ingredients} ({rows.length})
      </button>
      <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}
          style={{ overflow: "hidden" }}
        >
        <ul className="space-y-1">
          {rows.map(ing => {
            const unit = ing.preset_units
              ? (locale === "th" ? ing.preset_units.unit_name_th : ing.preset_units.unit_name_en)
              : "";
            const base = parseAmount(ing.ingredient_amount);
            const scaled = base !== null && qty > 1 ? formatAmount(base * qty) : null;
            return (
              <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                <span className="text-foreground flex-1">{getIngredientName(ing, locale)}</span>
                <span className="text-muted shrink-0">{ing.ingredient_amount}{unit ? ` ${unit}` : ""}</span>
                {scaled !== null && (
                  <span className="text-orange-500 font-semibold shrink-0">= {scaled}{unit ? ` ${unit}` : ""}</span>
                )}
              </li>
            );
          })}
        </ul>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

// ── RecipeCard ────────────────────────────────────────────────────

function RecipeCard({
  entry, locale, onQuantityChange, onRemove,
}: {
  entry: ShoppingListEntry;
  locale: "th" | "en";
  onQuantityChange: (recipeId: string, qty: number) => void;
  onRemove: (recipeId: string) => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const r = entry.recipe;
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex gap-3 items-start">
        {r.image_url ? (
          <img src={r.image_url} alt={r.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-elevated flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-muted opacity-40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug truncate">{r.title}</p>
          <p className="text-xs text-muted mt-0.5">
            {[
              r.servings ? `${s.serving} ${r.servings}` : null,
              r.cook_time_minutes ? `${r.cook_time_minutes} ${s.cookMin}` : null,
            ].filter(Boolean).join("  ·  ")}
          </p>
        </div>
        <button
          onClick={() => onRemove(r.id)}
          className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => onQuantityChange(r.id, entry.quantity - 1)}
          disabled={entry.quantity <= 1}
          className="w-8 h-8 rounded-full bg-elevated hover:bg-border flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <Minus className="w-3.5 h-3.5 text-secondary" />
        </button>
        <span className="text-sm font-semibold text-foreground w-16 text-center">
          {entry.quantity} {s.timesUnit}
        </span>
        <button
          onClick={() => onQuantityChange(r.id, entry.quantity + 1)}
          className="w-8 h-8 rounded-full bg-elevated hover:bg-border flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-secondary" />
        </button>
      </div>
      {(r.ingredient_rows ?? []).length > 0 && (
        <IngredientList rows={r.ingredient_rows ?? []} locale={locale} qty={entry.quantity} />
      )}
    </div>
  );
}

// ── StorePicker — multi-select bottom drawer ──────────────────────

function StorePicker({
  onClose, ingredientName, ingredientKey, stores, currentStoreIds, onSave,
}: {
  open?: boolean;
  onClose: () => void;
  ingredientName: string;
  ingredientKey: string;
  stores: UserStore[];
  currentStoreIds: Set<string>;
  onSave: (key: string, storeIds: Set<string>) => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(currentStoreIds));

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleClose = () => {
    onSave(ingredientKey, selected);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={handleClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[75vh] w-full sm:max-w-sm flex flex-col"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="text-xs text-muted">{s.pickStore}</p>
            <button onClick={handleClose} className="shrink-0 text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="font-semibold text-foreground text-sm truncate">{ingredientName}</p>
        </div>

        {/* Store list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {stores.length === 0 && (
            <p className="text-sm text-muted text-center py-8">{s.noStores}</p>
          )}
          {stores.map(store => {
            const on = selected.has(store.id);
            return (
              <button
                key={store.id}
                onClick={() => toggle(store.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  on ? "bg-elevated border border-border" : "hover:bg-elevated/60"
                }`}
              >
                <div className="w-4 h-4 rounded-full shrink-0" style={{ background: store.color }} />
                <span className="text-sm text-foreground flex-1">{store.name}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  on ? "border-green-500 bg-green-500" : "border-border"
                }`}>
                  {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-6 pt-3 border-t border-border/50 flex gap-2 shrink-0">
          <button
            onClick={() => setSelected(new Set())}
            className="px-4 py-2.5 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors"
          >
            {s.clearStores}
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            {selected.size === 0
              ? s.noStore
              : s.doneBtn.replace("{n}", String(selected.size))}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Multi-store pill for Combined view ────────────────────────────

function StorePills({
  storeIds, storeMap, onClick,
}: {
  storeIds: Set<string>;
  storeMap: Map<string, UserStore>;
  onClick: () => void;
}) {
  const assigned = [...storeIds].map(id => storeMap.get(id)).filter(Boolean) as UserStore[];

  if (assigned.length === 0) {
    return (
      <button onClick={onClick}
        className="shrink-0 p-1.5 rounded-lg bg-elevated hover:bg-border text-muted transition-colors">
        <MapPin className="w-3.5 h-3.5" />
      </button>
    );
  }
  if (assigned.length === 1) {
    return (
      <button onClick={onClick}
        className="shrink-0 px-2.5 py-1 rounded-lg text-xs text-white font-medium max-w-[80px] truncate transition-opacity hover:opacity-80"
        style={{ background: assigned[0].color }}>
        {assigned[0].name}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-elevated hover:bg-border transition-colors">
      {assigned.slice(0, 3).map(s => (
        <div key={s.id} className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
      ))}
      {assigned.length > 3 && (
        <span className="text-[10px] text-muted ml-0.5">+{assigned.length - 3}</span>
      )}
    </button>
  );
}

// ── CombinedView ──────────────────────────────────────────────────

function CombinedView({
  items, locale, stores, storePrefs, onPickStore, onClearAll,
}: {
  items: ShoppingListEntry[];
  locale: "th" | "en";
  stores: UserStore[];
  storePrefs: Map<string, Set<string>>;
  onPickStore: (key: string, name: string, currentStoreIds: Set<string>) => void;
  onClearAll: () => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rv_shopping_checked");
      if (stored) setChecked(new Set(JSON.parse(stored) as string[]));
    } catch {}
  }, []);

  const toggleCheck = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("rv_shopping_checked", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const clearChecked = () => {
    setChecked(new Set());
    try { localStorage.removeItem("rv_shopping_checked"); } catch {}
  };

  const combined = buildCombined(items, locale);
  const unchecked = combined.filter(c => !checked.has(c.key));
  const checkedItems = combined.filter(c => checked.has(c.key));
  const allDone = combined.length > 0 && unchecked.length === 0;

  if (combined.length === 0) {
    return <div className="text-center py-12 text-muted text-sm">{s.totalIngredients.replace("{n}", "0")}</div>;
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-2xl font-bold text-foreground">{s.allDone}</p>
        <p className="text-sm text-muted">{s.totalIngredients.replace("{n}", String(combined.length))}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={clearChecked}
            className="px-4 py-2 rounded-xl text-sm border border-border text-muted hover:bg-elevated transition-colors">
            {s.keepList}
          </button>
          <button onClick={onClearAll}
            className="px-4 py-2 rounded-xl text-sm bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors">
            {s.finishShopping}
          </button>
        </div>
      </div>
    );
  }

  const storeMap = new Map(stores.map(st => [st.id, st]));

  const renderItem = (c: CombinedIng) => {
    const isChecked = checked.has(c.key);
    const amountDisplay = c.totalAmount !== null
      ? `${formatAmount(c.totalAmount)}${c.unit ? ` ${c.unit}` : ""}`
      : c.sources.map(src => `${src.amount}${c.unit ? ` ${c.unit}` : ""} ×${src.qty}`).join(" + ");
    const currentStoreIds = storePrefs.get(c.presetIngredientId) ?? new Set<string>();

    return (
      <motion.div
        key={c.key}
        layoutId={`ing-${c.key}`}
        layout="position"
        animate={{ opacity: isChecked ? 0.55 : 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="flex items-start gap-3 px-4 py-3"
      >
        <motion.button
          onClick={() => toggleCheck(c.key)}
          whileTap={{ scale: 0.7 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isChecked ? "bg-green-500 border-green-500" : "border-border hover:border-green-400"
          }`}
        >
          <AnimatePresence>
            {isChecked && (
              <motion.svg viewBox="0 0 14 12" fill="none" className="w-3 h-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path
                  d="M1.5 6L5.5 10L12.5 1.5"
                  stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleCheck(c.key)}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isChecked ? "line-through text-muted" : "text-foreground"}`}>{c.name}</span>
            <span className={`text-sm ${isChecked ? "line-through text-muted" : "text-orange-500 font-semibold"}`}>{amountDisplay}</span>
          </div>
          {c.sources.length > 1 && (
            <p className="text-[11px] text-muted mt-0.5 truncate">
              {c.sources.map(src => `${src.title} ×${src.qty}`).join("  ·  ")}
            </p>
          )}
        </div>
        <StorePills
          storeIds={currentStoreIds}
          storeMap={storeMap}
          onClick={() => onPickStore(c.presetIngredientId, c.name, currentStoreIds)}
        />
      </motion.div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-muted">{s.totalIngredients.replace("{n}", String(combined.length))}</p>
        {checkedItems.length > 0 && (
          <button onClick={clearChecked} className="text-xs text-orange-500 hover:text-orange-600 transition-colors">
            {s.clearChecked}
          </button>
        )}
      </div>
      <LayoutGroup id="combined-list">
        <div className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
          {unchecked.map(renderItem)}
          {checkedItems.length > 0 && unchecked.length > 0 && (
            <motion.div layout key="sep" className="px-4 py-1.5 bg-elevated/30">
              <p className="text-[11px] text-muted">{`✓ ${checkedItems.length}`}</p>
            </motion.div>
          )}
          {checkedItems.map(renderItem)}
        </div>
      </LayoutGroup>
    </div>
  );
}

// ── StoresTab ──────────────────────────────────────────────────────

function StoresTab({
  stores, storePrefs, items, locale, onStoresChange,
}: {
  stores: UserStore[];
  storePrefs: Map<string, Set<string>>;
  items: ShoppingListEntry[];
  locale: "th" | "en";
  onStoresChange: (s: UserStore[]) => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<UserStore | undefined>(undefined);
  const [deleteStoreTarget, setDeleteStoreTarget] = useState<string | null>(null);

  const combined = buildCombined(items, locale);
  const { route, unassigned } = computeRoute(combined, storePrefs, stores);

  // Coverage count per store for the store cards
  const storeItemCounts: Record<string, number> = {};
  for (const c of combined) {
    for (const sid of (storePrefs.get(c.presetIngredientId) ?? new Set())) {
      storeItemCounts[sid] = (storeItemCounts[sid] ?? 0) + 1;
    }
  }

  const handleSaveStore = (saved: UserStore) => {
    const exists = stores.find(st => st.id === saved.id);
    onStoresChange(exists ? stores.map(st => st.id === saved.id ? saved : st) : [...stores, saved]);
    setFormOpen(false);
    setEditStore(undefined);
  };

  const handleDeleteStore = (storeId: string) => {
    setDeleteStoreTarget(storeId);
  };

  const executeDeleteStore = async (storeId: string) => {
    const { deleteUserStore } = await import("@/app/actions/stores");
    const res = await deleteUserStore(storeId);
    if ("error" in res) { toast.error(res.error); return; }
    onStoresChange(stores.filter(st => st.id !== storeId));
  };

  const assignedItemCount = combined.length - unassigned.length;

  return (
    <div className="space-y-5">

      {/* ── Recommendation ──────────────────────────────────────── */}
      {combined.length > 0 && stores.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-elevated/40">
            <Route className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground">{s.routeTitle}</span>
            {route.length > 0 && (
              <span className="ml-auto text-xs text-muted">
                {s.routeSummary
                  .replace("{stores}", String(route.length))
                  .replace("{items}", String(assignedItemCount))}
              </span>
            )}
          </div>

          {/* Route stops */}
          {route.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted text-center">
              {s.noStoresSub}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {route.map((stop, i) => (
                <div key={stop.store.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: stop.store.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{stop.store.name}</span>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ background: stop.store.color }}>
                      {s.itemsAt.replace("{n}", String(stop.items.length))}
                    </span>
                  </div>
                  <p className="text-xs text-secondary pl-7 leading-relaxed">
                    {stop.items.map(c => c.name).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Unassigned items */}
          {unassigned.length > 0 && (
            <div className="px-4 py-3 border-t border-border/60 bg-elevated/20">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                <span className="text-sm text-muted font-medium">{s.unassigned}</span>
                <span className="ml-auto text-xs text-muted">{s.itemsAt.replace("{n}", String(unassigned.length))}</span>
              </div>
              <p className="text-xs text-secondary pl-7 leading-relaxed">
                {unassigned.map(c => c.name).join(" · ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Store list ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{s.myStores}</h2>
          {!formOpen && !editStore && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />{s.addStore}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {formOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              style={{ overflow: "hidden" }}
              className="mb-3"
            >
              <StoreFormInline
                onSave={handleSaveStore}
                onCancel={() => setFormOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Leaflet map (between header and list) ── */}
        {stores.some(st => st.latitude !== null) && (
          <div className="mb-3">
            <DynamicMap stores={stores} storeItemCounts={storeItemCounts} itemsLabel={s.itemsAt} />
          </div>
        )}

        {stores.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border">
            <Store className="w-10 h-10 mx-auto text-muted opacity-30 mb-3" />
            <p className="text-sm text-muted">{s.noStores}</p>
            <p className="text-xs text-muted mt-1">{s.noStoresSub}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stores.map(store => (
              <div key={store.id}>
                <AnimatePresence initial={false} mode="wait">
                  {editStore?.id === store.id ? (
                    <motion.div
                      key={`edit-${store.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
                      style={{ overflow: "hidden" }}
                    >
                      <StoreFormInline
                        store={store}
                        onSave={handleSaveStore}
                        onCancel={() => setEditStore(undefined)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key={`display-${store.id}`} initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: store.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{store.name}</p>
                        {store.latitude != null ? (
                          <a href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-500 flex items-center gap-0.5 transition-colors">
                            <ExternalLink className="w-3 h-3" /> {s.viewGoogleMaps}
                          </a>
                        ) : (
                          <p className="text-xs text-muted">{s.noLocation}</p>
                        )}
                      </div>
                      {combined.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white shrink-0"
                          style={{ background: store.color }}>
                          {s.itemsAt.replace("{n}", String(storeItemCounts[store.id] ?? 0))}
                        </span>
                      )}
                      <button onClick={() => { setFormOpen(false); setEditStore(store); }}
                        className="p-1.5 text-muted hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteStore(store.id)}
                        className="p-1.5 text-muted hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteStoreTarget}
        onOpenChange={(o) => !o && setDeleteStoreTarget(null)}
        title={s.storeDeleteConfirm.replace("{name}", stores.find(st => st.id === deleteStoreTarget)?.name ?? "")}
        onConfirm={() => deleteStoreTarget && executeDeleteStore(deleteStoreTarget)}
        danger
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function ShoppingClient({
  initialItems, initialStores, initialStorePrefs, locale,
}: {
  initialItems: ShoppingListEntry[];
  initialStores: UserStore[];
  initialStorePrefs: IngredientStorePref[];
  locale: "th" | "en";
}) {
  const router = useRouter();
  const { t } = useLocale();
  const s = t.shopping;

  const [items, setItems] = useState<ShoppingListEntry[]>(initialItems);
  const [stores, setStores] = useState<UserStore[]>(initialStores);
  const [storePrefs, setStorePrefs] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const p of initialStorePrefs) {
      const set = map.get(p.preset_ingredient_id) ?? new Set<string>();
      set.add(p.store_id);
      map.set(p.preset_ingredient_id, set);
    }
    return map;
  });
  const [tab, setTab] = useState<"per" | "combined" | "map">("per");
  const [clearSignal, setClearSignal] = useState(0);
  const [, startTransition] = useTransition();
  const [picker, setPicker] = useState<{ presetIngredientId: string; name: string; storeIds: Set<string> } | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleQuantityChange = (recipeId: string, qty: number) => {
    if (qty < 1) { handleRemove(recipeId); return; }
    setItems(prev => prev.map(e => e.recipe.id === recipeId ? { ...e, quantity: qty } : e));
    startTransition(async () => {
      const res = await updateShoppingQuantity(recipeId, qty);
      if ("error" in res) { toast.error(res.error); router.refresh(); }
    });
  };

  const handleRemove = (recipeId: string) => {
    setItems(prev => prev.filter(e => e.recipe.id !== recipeId));
    startTransition(async () => {
      const res = await removeFromShoppingList(recipeId);
      if ("error" in res) { toast.error(res.error); router.refresh(); }
    });
  };

  const handleClearAll = () => setConfirmClearOpen(true);

  const executeClearAll = async () => {
    setItems([]);
    try { localStorage.removeItem("rv_shopping_checked"); } catch {}
    setClearSignal(n => n + 1);
    const res = await clearShoppingList();
    if ("error" in res) { toast.error(res.error); router.refresh(); }
  };

  const handlePickStore = (presetIngredientId: string, name: string, currentStoreIds: Set<string>) =>
    setPicker({ presetIngredientId, name, storeIds: currentStoreIds });

  const handleStoreAssign = async (presetIngredientId: string, storeIds: Set<string>) => {
    setStorePrefs(prev => new Map(prev).set(presetIngredientId, storeIds));
    const { setIngredientStorePrefs } = await import("@/app/actions/stores");
    const res = await setIngredientStorePrefs(presetIngredientId, [...storeIds]);
    if ("error" in res) toast.error(res.error);
  };

  const combinedCount = buildCombined(items, locale).length;

  const TABS: { key: "per" | "combined" | "map"; label: string }[] = [
    { key: "per",      label: s.perRecipeTab },
    { key: "combined", label: combinedCount > 0 ? `${s.combinedTab} (${combinedCount})` : s.combinedTab },
    { key: "map",      label: s.storesTab },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />{s.backHome}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
          {items.length > 0 && (
            <span className="text-sm text-muted font-normal">
              {t.library.shoppingListCount.replace("{n}", String(items.length))}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll}
            className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />{s.clearAll}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === key ? "text-orange-500" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
            {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {tab === "per" && (
            items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <ShoppingCart className="w-14 h-14 text-muted opacity-20" />
                <p className="text-base font-medium text-foreground">{s.empty}</p>
                <p className="text-sm text-muted max-w-xs">{s.emptySub}</p>
                <Link href="/" className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  {s.backHome}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(entry => (
                  <RecipeCard key={entry.recipe.id} entry={entry} locale={locale}
                    onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
                ))}
              </div>
            )
          )}

          {tab === "combined" && (
            items.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">{s.totalIngredients.replace("{n}", "0")}</div>
            ) : (
              <CombinedView key={clearSignal} items={items} locale={locale} stores={stores}
                storePrefs={storePrefs} onPickStore={handlePickStore} onClearAll={handleClearAll} />
            )
          )}

          {tab === "map" && (
            <StoresTab stores={stores} storePrefs={storePrefs} items={items}
              locale={locale} onStoresChange={setStores} />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
      {picker && (
        <StorePicker
          key="store-picker"
          open
          onClose={() => setPicker(null)}
          ingredientName={picker.name}
          ingredientKey={picker.presetIngredientId}
          stores={stores}
          currentStoreIds={picker.storeIds}
          onSave={handleStoreAssign}
        />
      )}
      </AnimatePresence>

      <AlertDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title={s.clearAllConfirm}
        onConfirm={executeClearAll}
        danger
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
      />
    </div>
  );
}
