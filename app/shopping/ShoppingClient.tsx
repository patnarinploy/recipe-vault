"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { removeFromShoppingList, updateShoppingQuantity, clearShoppingList } from "@/app/actions/shopping";
import type { ShoppingListEntry, DbIngredient } from "@/lib/types";
import { useLocale } from "@/lib/locale";

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

function buildCombined(
  items: ShoppingListEntry[],
  locale: "th" | "en",
): CombinedIng[] {
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
        map.set(key, {
          key,
          name,
          unit,
          totalAmount: parsed !== null ? parsed * item.quantity : null,
          sources: [source],
        });
      }
    }
  }

  return Array.from(map.values());
}

// ── Ingredient list (per recipe) ──────────────────────────────────

function IngredientList({
  rows,
  locale,
}: {
  rows: DbIngredient[];
  locale: "th" | "en";
}) {
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
                <span className="text-muted shrink-0">
                  {ing.ingredient_amount}{unit ? ` ${unit}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Per-recipe card ────────────────────────────────────────────────

function RecipeCard({
  entry,
  locale,
  onQuantityChange,
  onRemove,
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
        {/* Thumbnail */}
        {r.image_url ? (
          <img
            src={r.image_url}
            alt={r.title}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-elevated flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-muted opacity-40" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug truncate">{r.title}</p>
          <p className="text-xs text-muted mt-0.5">
            {[
              r.servings ? `${s.serving} ${r.servings}` : null,
              r.cook_time_minutes ? `${r.cook_time_minutes} ${s.cookMin}` : null,
            ].filter(Boolean).join("  ·  ")}
          </p>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(r.id)}
          className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quantity control */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => onQuantityChange(r.id, entry.quantity - 1)}
          className="w-8 h-8 rounded-full bg-elevated hover:bg-border flex items-center justify-center transition-colors disabled:opacity-30"
          disabled={entry.quantity <= 1}
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

      {/* Ingredients */}
      {(r.ingredient_rows ?? []).length > 0 && (
        <IngredientList rows={r.ingredient_rows ?? []} locale={locale} />
      )}
    </div>
  );
}

// ── Combined checklist ────────────────────────────────────────────

function CombinedView({
  items,
  locale,
}: {
  items: ShoppingListEntry[];
  locale: "th" | "en";
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
    return (
      <div className="text-center py-12 text-muted text-sm">
        {s.totalIngredients.replace("{n}", "0")}
      </div>
    );
  }

  const renderItem = (c: CombinedIng) => {
    const isChecked = checked.has(c.key);
    const amountDisplay = c.totalAmount !== null
      ? `${formatAmount(c.totalAmount)}${c.unit ? ` ${c.unit}` : ""}`
      : c.sources.map(s => `${s.amount}${c.unit ? ` ${c.unit}` : ""} ×${s.qty}`).join(" + ");

    return (
      <div
        key={c.key}
        onClick={() => toggleCheck(c.key)}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors select-none ${
          isChecked
            ? "bg-elevated/50 opacity-50"
            : "hover:bg-elevated/60"
        }`}
      >
        {/* Checkbox */}
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          isChecked ? "bg-green-500 border-green-500" : "border-border"
        }`}>
          {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isChecked ? "line-through text-muted" : "text-foreground"}`}>
              {c.name}
            </span>
            <span className={`text-sm ${isChecked ? "line-through text-muted" : "text-orange-500 font-semibold"}`}>
              {amountDisplay}
            </span>
          </div>
          {c.sources.length > 1 && (
            <p className="text-[11px] text-muted mt-0.5 truncate">
              {c.sources.map(src => `${src.title} ×${src.qty}`).join("  ·  ")}
            </p>
          )}
        </div>
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

// ── Main component ────────────────────────────────────────────────

export default function ShoppingClient({
  initialItems,
  locale,
}: {
  initialItems: ShoppingListEntry[];
  locale: "th" | "en";
}) {
  const router = useRouter();
  const { t } = useLocale();
  const s = t.shopping;

  const [items, setItems] = useState<ShoppingListEntry[]>(initialItems);
  const [tab, setTab] = useState<"per" | "combined">("per");
  const [, startTransition] = useTransition();

  const handleQuantityChange = (recipeId: string, qty: number) => {
    if (qty < 1) {
      handleRemove(recipeId);
      return;
    }
    setItems(prev => prev.map(e => e.recipe.id === recipeId ? { ...e, quantity: qty } : e));
    startTransition(async () => {
      const res = await updateShoppingQuantity(recipeId, qty);
      if ("error" in res) {
        toast.error(res.error);
        router.refresh();
      }
    });
  };

  const handleRemove = (recipeId: string) => {
    setItems(prev => prev.filter(e => e.recipe.id !== recipeId));
    startTransition(async () => {
      const res = await removeFromShoppingList(recipeId);
      if ("error" in res) {
        toast.error(res.error);
        router.refresh();
      }
    });
  };

  const handleClearAll = async () => {
    if (!confirm(s.clearAllConfirm)) return;
    setItems([]);
    const res = await clearShoppingList();
    if ("error" in res) {
      toast.error(res.error);
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {s.backHome}
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
            <Trash2 className="w-3.5 h-3.5" />
            {s.clearAll}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ShoppingCart className="w-14 h-14 text-muted opacity-20" />
          <p className="text-base font-medium text-foreground">{s.empty}</p>
          <p className="text-sm text-muted max-w-xs">{s.emptySub}</p>
          <Link href="/" className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
            {s.backHome}
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-6">
            {(["per", "combined"] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  tab === tabKey ? "text-orange-500" : "text-muted hover:text-foreground"
                }`}
              >
                {tabKey === "per" ? s.perRecipeTab : s.combinedTab}
                {tab === tabKey && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {tab === "per" && (
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
          )}

          {tab === "combined" && (
            <CombinedView items={items} locale={locale} />
          )}
        </>
      )}
    </div>
  );
}
