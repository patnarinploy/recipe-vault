"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ChevronDown, ChevronUp,
  Check, MapPin, X, Pencil, Loader2, Navigation, Store,
} from "lucide-react";
import { removeFromShoppingList, updateShoppingQuantity, clearShoppingList } from "@/app/actions/shopping";
import type { ShoppingListEntry, DbIngredient, UserStore, IngredientStorePref } from "@/lib/types";
import { useLocale } from "@/lib/locale";

const DynamicMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

const STORE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

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
  name: string;
  unit: string;
  totalAmount: number | null;
  sources: { title: string; amount: string; qty: number }[];
}

function buildCombined(items: ShoppingListEntry[], locale: "th" | "en"): CombinedIng[] {
  const map = new Map<string, CombinedIng>();
  for (const item of items) {
    for (const ing of item.recipe.ingredient_rows ?? []) {
      const name = ing.ingredient_name.trim();
      const unit = ing.preset_units
        ? (locale === "th" ? ing.preset_units.unit_name_th : ing.preset_units.unit_name_en)
        : "";
      const key = `${name.toLowerCase()}:::${unit.toLowerCase()}`;
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
        map.set(key, { key, name, unit, totalAmount: parsed !== null ? parsed * item.quantity : null, sources: [source] });
      }
    }
  }
  return Array.from(map.values());
}

// ── IngredientList (per recipe) ───────────────────────────────────

function IngredientList({ rows, locale }: { rows: DbIngredient[]; locale: "th" | "en" }) {
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
      {open && (
        <ul className="space-y-1">
          {rows.map(ing => {
            const unit = ing.preset_units
              ? (locale === "th" ? ing.preset_units.unit_name_th : ing.preset_units.unit_name_en)
              : "";
            return (
              <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                <span className="text-foreground flex-1">{ing.ingredient_name}</span>
                <span className="text-muted shrink-0">{ing.ingredient_amount}{unit ? ` ${unit}` : ""}</span>
              </li>
            );
          })}
        </ul>
      )}
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
        <IngredientList rows={r.ingredient_rows ?? []} locale={locale} />
      )}
    </div>
  );
}

// ── StorePicker bottom drawer ─────────────────────────────────────

function StorePicker({
  open, onClose, ingredientName, ingredientKey, stores, currentStoreId, onPick,
}: {
  open: boolean;
  onClose: () => void;
  ingredientName: string;
  ingredientKey: string;
  stores: UserStore[];
  currentStoreId: string | null;
  onPick: (key: string, storeId: string | null) => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-surface rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto anim-scale-in"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="text-xs text-muted">{s.pickStore}</p>
            <button onClick={onClose} className="shrink-0 text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="font-semibold text-foreground text-sm truncate">{ingredientName}</p>
        </div>
        <div className="p-3 space-y-1">
          <button
            onClick={() => { onPick(ingredientKey, null); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
              !currentStoreId ? "bg-elevated border border-border" : "hover:bg-elevated/60"
            }`}
          >
            <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
            <span className="text-sm text-muted">{s.noStore}</span>
            {!currentStoreId && <Check className="w-4 h-4 text-green-500 ml-auto" />}
          </button>
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => { onPick(ingredientKey, store.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                currentStoreId === store.id ? "bg-elevated border border-border" : "hover:bg-elevated/60"
              }`}
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: store.color }} />
              <span className="text-sm text-foreground">{store.name}</span>
              {currentStoreId === store.id && <Check className="w-4 h-4 text-green-500 ml-auto" />}
            </button>
          ))}
          {stores.length === 0 && (
            <p className="text-sm text-muted text-center py-8">{s.noStores}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StoreForm modal ────────────────────────────────────────────────

function StoreForm({ store, onSave, onCancel }: {
  store?: UserStore;
  onSave: (saved: UserStore) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [name, setName] = useState(store?.name ?? "");
  const [color, setColor] = useState(store?.color ?? STORE_COLORS[4]);
  const [lat, setLat] = useState(store?.latitude != null ? String(store.latitude) : "");
  const [lng, setLng] = useState(store?.longitude != null ? String(store.longitude) : "");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) { toast.error(s.locationError); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setLocating(false); },
      () => { toast.error(s.locationError); setLocating(false); },
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;
    try {
      if (store) {
        const { updateUserStore } = await import("@/app/actions/stores");
        const res = await updateUserStore(store.id, { name, color, latitude: latNum, longitude: lngNum });
        if ("error" in res) { toast.error(res.error); setSaving(false); return; }
        onSave({ ...store, name: name.trim(), color, latitude: latNum, longitude: lngNum });
      } else {
        const { createUserStore } = await import("@/app/actions/stores");
        const res = await createUserStore(name, color, latNum, lngNum);
        if ("error" in res) { toast.error(res.error); setSaving(false); return; }
        onSave(res);
      }
    } catch { toast.error(t.common.error); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" onMouseDown={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 anim-scale-in"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{store ? s.editStore : s.addStore}</h3>
          <button onClick={onCancel} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block">{s.storeName}</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={s.storeNamePh}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) handleSave(); }}
            className="w-full border border-outline rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground"
          />
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block">{s.storeColor}</label>
          <div className="flex gap-2 flex-wrap">
            {STORE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: 2 }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block">{s.storeLocation}</label>
          <div className="flex gap-2 mb-2">
            <input
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder={s.lat}
              type="number"
              step="any"
              className="flex-1 border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground"
            />
            <input
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder={s.lng}
              type="number"
              step="any"
              className="flex-1 border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground"
            />
          </div>
          <button
            onClick={handleLocate}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {locating ? s.locating : s.useMyLocation}
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm text-secondary bg-elevated hover:bg-border transition-colors">
            {t.common.cancel}
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CombinedView (with store tags) ────────────────────────────────

function CombinedView({
  items, locale, stores, storePrefs, onPickStore,
}: {
  items: ShoppingListEntry[];
  locale: "th" | "en";
  stores: UserStore[];
  storePrefs: Map<string, string | null>;
  onPickStore: (key: string, name: string, currentStoreId: string | null) => void;
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

  if (combined.length === 0) {
    return <div className="text-center py-12 text-muted text-sm">{s.totalIngredients.replace("{n}", "0")}</div>;
  }

  const storeMap = new Map(stores.map(st => [st.id, st]));

  const renderItem = (c: CombinedIng) => {
    const isChecked = checked.has(c.key);
    const amountDisplay = c.totalAmount !== null
      ? `${formatAmount(c.totalAmount)}${c.unit ? ` ${c.unit}` : ""}`
      : c.sources.map(src => `${src.amount}${c.unit ? ` ${c.unit}` : ""} ×${src.qty}`).join(" + ");
    const currentStoreId = storePrefs.get(c.key) ?? null;
    const currentStore = currentStoreId ? storeMap.get(currentStoreId) : null;

    return (
      <div key={c.key} className={`flex items-start gap-3 px-4 py-3 transition-colors ${isChecked ? "opacity-50" : ""}`}>
        <button
          onClick={() => toggleCheck(c.key)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isChecked ? "bg-green-500 border-green-500" : "border-border hover:border-green-400"
          }`}
        >
          {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
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
        <button
          onClick={() => onPickStore(c.key, c.name, currentStoreId)}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            currentStore ? "text-white font-medium" : "bg-elevated hover:bg-border text-muted"
          }`}
          style={currentStore ? { background: currentStore.color } : undefined}
        >
          {currentStore
            ? <span className="max-w-[72px] truncate">{currentStore.name}</span>
            : <><MapPin className="w-3 h-3" /><span className="hidden xs:inline">{s.noStore}</span></>
          }
        </button>
      </div>
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
      <div className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
        {unchecked.map(renderItem)}
        {checkedItems.length > 0 && unchecked.length > 0 && (
          <div className="px-4 py-1.5 bg-elevated/30">
            <p className="text-[11px] text-muted">{`✓ ${checkedItems.length}`}</p>
          </div>
        )}
        {checkedItems.map(renderItem)}
      </div>
    </div>
  );
}

// ── StoresTab ──────────────────────────────────────────────────────

function StoresTab({
  stores, storePrefs, items, locale, onStoresChange,
}: {
  stores: UserStore[];
  storePrefs: Map<string, string | null>;
  items: ShoppingListEntry[];
  locale: "th" | "en";
  onStoresChange: (s: UserStore[]) => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<UserStore | undefined>(undefined);

  const combined = buildCombined(items, locale);
  const storeItemCounts: Record<string, number> = {};
  let unassignedCount = 0;
  for (const c of combined) {
    const storeId = storePrefs.get(c.key) ?? null;
    if (storeId) storeItemCounts[storeId] = (storeItemCounts[storeId] ?? 0) + 1;
    else unassignedCount++;
  }

  const handleSaveStore = (saved: UserStore) => {
    const exists = stores.find(st => st.id === saved.id);
    onStoresChange(exists ? stores.map(st => st.id === saved.id ? saved : st) : [...stores, saved]);
    setFormOpen(false);
    setEditStore(undefined);
  };

  const handleDeleteStore = async (storeId: string) => {
    const store = stores.find(st => st.id === storeId);
    if (!confirm(s.storeDeleteConfirm.replace("{name}", store?.name ?? ""))) return;
    const { deleteUserStore } = await import("@/app/actions/stores");
    const res = await deleteUserStore(storeId);
    if ("error" in res) { toast.error(res.error); return; }
    onStoresChange(stores.filter(st => st.id !== storeId));
  };

  return (
    <div className="space-y-5">
      {/* Store list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{s.myStores}</h2>
          <button
            onClick={() => { setEditStore(undefined); setFormOpen(true); }}
            className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />{s.addStore}
          </button>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border">
            <Store className="w-10 h-10 mx-auto text-muted opacity-30 mb-3" />
            <p className="text-sm text-muted">{s.noStores}</p>
            <p className="text-xs text-muted/70 mt-1">{s.noStoresSub}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stores.map(store => (
              <div key={store.id} className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: store.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{store.name}</p>
                  <p className="text-xs text-muted">
                    {store.latitude != null ? `${store.latitude}, ${store.longitude}` : s.noLocation}
                  </p>
                </div>
                {combined.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium text-white shrink-0"
                    style={{ background: store.color }}
                  >
                    {s.itemsAt.replace("{n}", String(storeItemCounts[store.id] ?? 0))}
                  </span>
                )}
                <button
                  onClick={() => { setEditStore(store); setFormOpen(true); }}
                  className="p-1.5 text-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id)}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet map */}
      {stores.some(st => st.latitude !== null) && (
        <DynamicMap
          stores={stores}
          storeItemCounts={storeItemCounts}
          itemsLabel={s.itemsAt}
        />
      )}

      {/* Breakdown by store */}
      {combined.length > 0 && (stores.length > 0 || unassignedCount > 0) && (
        <div className="space-y-3">
          {stores.map(store => {
            const storeItems = combined.filter(c => (storePrefs.get(c.key) ?? null) === store.id);
            if (storeItems.length === 0) return null;
            return (
              <div key={store.id} className="bg-surface rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: store.color }} />
                  <span className="text-sm font-semibold text-foreground">{store.name}</span>
                  <span className="text-xs text-muted ml-auto">{s.itemsAt.replace("{n}", String(storeItems.length))}</span>
                </div>
                <ul className="space-y-1.5">
                  {storeItems.map(c => (
                    <li key={c.key} className="flex items-baseline gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0 mt-1.5" />
                      <span className="text-foreground flex-1">{c.name}</span>
                      <span className="text-muted shrink-0 text-xs">
                        {c.totalAmount !== null ? `${formatAmount(c.totalAmount)}${c.unit ? ` ${c.unit}` : ""}` : c.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full border-2 border-muted shrink-0" />
                <span className="text-sm font-semibold text-muted">{s.noStore}</span>
                <span className="text-xs text-muted ml-auto">{s.itemsAt.replace("{n}", String(unassignedCount))}</span>
              </div>
              <ul className="space-y-1.5">
                {combined.filter(c => !(storePrefs.get(c.key) ?? null)).map(c => (
                  <li key={c.key} className="flex items-baseline gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0 mt-1.5" />
                    <span className="text-foreground flex-1">{c.name}</span>
                    <span className="text-muted shrink-0 text-xs">
                      {c.totalAmount !== null ? `${formatAmount(c.totalAmount)}${c.unit ? ` ${c.unit}` : ""}` : c.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <StoreForm
          store={editStore}
          onSave={handleSaveStore}
          onCancel={() => { setFormOpen(false); setEditStore(undefined); }}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function ShoppingClient({
  initialItems,
  initialStores,
  initialStorePrefs,
  locale,
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
  const [storePrefs, setStorePrefs] = useState<Map<string, string | null>>(
    () => new Map(initialStorePrefs.map(p => [p.ingredient_key, p.store_id])),
  );
  const [tab, setTab] = useState<"per" | "combined" | "map">("per");
  const [, startTransition] = useTransition();
  const [picker, setPicker] = useState<{ key: string; name: string; storeId: string | null } | null>(null);

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

  const handleClearAll = async () => {
    if (!confirm(s.clearAllConfirm)) return;
    setItems([]);
    const res = await clearShoppingList();
    if ("error" in res) { toast.error(res.error); router.refresh(); }
  };

  const handlePickStore = (key: string, name: string, currentStoreId: string | null) => {
    setPicker({ key, name, storeId: currentStoreId });
  };

  const handleStoreAssign = async (key: string, storeId: string | null) => {
    setStorePrefs(prev => new Map(prev).set(key, storeId));
    const { setIngredientStorePref } = await import("@/app/actions/stores");
    const res = await setIngredientStorePref(key, storeId);
    if ("error" in res) toast.error(res.error);
  };

  const TABS: { key: "per" | "combined" | "map"; label: string }[] = [
    { key: "per",      label: s.perRecipeTab },
    { key: "combined", label: s.combinedTab },
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
          <button
            onClick={handleClearAll}
            className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />{s.clearAll}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === key ? "text-orange-500" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
            {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab: per recipe */}
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
              <RecipeCard
                key={entry.recipe.id}
                entry={entry}
                locale={locale}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )
      )}

      {/* Tab: combined */}
      {tab === "combined" && (
        items.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">{s.totalIngredients.replace("{n}", "0")}</div>
        ) : (
          <CombinedView
            items={items}
            locale={locale}
            stores={stores}
            storePrefs={storePrefs}
            onPickStore={handlePickStore}
          />
        )
      )}

      {/* Tab: map / stores */}
      {tab === "map" && (
        <StoresTab
          stores={stores}
          storePrefs={storePrefs}
          items={items}
          locale={locale}
          onStoresChange={setStores}
        />
      )}

      {/* Store picker bottom sheet */}
      {picker && (
        <StorePicker
          open
          onClose={() => setPicker(null)}
          ingredientName={picker.name}
          ingredientKey={picker.key}
          stores={stores}
          currentStoreId={picker.storeId}
          onPick={handleStoreAssign}
        />
      )}
    </div>
  );
}
