"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChefHat, Loader2, ExternalLink } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { UserStore } from "@/lib/types";
import {
  getRecipesByIngredientId,
  getRecipesByUnitId,
  getRecipesByCategoryId,
  getIngredientsByStoreId,
} from "@/app/actions/user-presets";

type RecipeRef = { id: string; title: string };

export interface IngredientDetailContent {
  kind: "ingredient";
  id: string;
  nameTh: string;
  nameEn: string;
  storeIds: string[];
  storeMap: Map<string, UserStore>;
}
export interface UnitDetailContent {
  kind: "unit";
  id: string;
  nameTh: string;
  nameEn: string;
}
export interface CategoryDetailContent {
  kind: "category";
  id: string;
  nameTh: string;
  nameEn: string;
}
export interface StoreDetailContent {
  kind: "store";
  store: UserStore;
}

export type DetailContent =
  | IngredientDetailContent
  | UnitDetailContent
  | CategoryDetailContent
  | StoreDetailContent;

export default function PresetDetailModal({
  open,
  onClose,
  detail,
}: {
  open: boolean;
  onClose: () => void;
  detail: DetailContent | null;
}) {
  const { t, locale } = useLocale();
  const d = t.settings.dropdowns;
  const [recipes, setRecipes] = useState<RecipeRef[] | null>(null);
  const [storeIngredients, setStoreIngredients] = useState<{ id: string; name_th: string; name_en: string }[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !detail) {
      setRecipes(null);
      setStoreIngredients(null);
      return;
    }
    setRecipes(null);
    setStoreIngredients(null);
    if (detail.kind === "ingredient") {
      getRecipesByIngredientId(detail.id).then(setRecipes);
    } else if (detail.kind === "unit") {
      getRecipesByUnitId(detail.id).then(setRecipes);
    } else if (detail.kind === "category") {
      getRecipesByCategoryId(detail.id).then(setRecipes);
    } else if (detail.kind === "store") {
      getIngredientsByStoreId(detail.store.id).then(setStoreIngredients);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detail?.kind === "store" ? detail.store.id : (detail as { id?: string })?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const primaryName = (th: string, en: string) => locale === "en" ? (en || th) : (th || en);
  const secondaryName = (th: string, en: string) => locale === "en" ? th : en;

  const modalTitle = !detail ? "" : detail.kind === "store"
    ? detail.store.name
    : primaryName(detail.nameTh, detail.nameEn);

  const subtitle = !detail || detail.kind === "store"
    ? undefined
    : secondaryName(detail.nameTh, detail.nameEn);

  if (!mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="preset-detail-backdrop"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && detail && (
          <motion.div
            key="preset-detail-panel"
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 99999 }}
          >
            <motion.div
              className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-5 py-4 border-b border-border shrink-0">
                {detail.kind === "store" && (
                  <span className="w-5 h-5 rounded-full shrink-0 mt-0.5" style={{ background: detail.store.color }} />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground leading-tight">{modalTitle}</h2>
                  {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="p-1 text-muted hover:text-foreground transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* Ingredient: store chips */}
                {detail.kind === "ingredient" && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">{d.ingredientStores}</p>
                    {detail.storeIds.length === 0 ? (
                      <p className="text-sm text-muted italic">{d.noStoreAssigned}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.storeIds.map(id => {
                          const st = detail.storeMap.get(id);
                          if (!st) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-elevated border border-border">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />
                              {st.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Store: GPS location */}
                {detail.kind === "store" && detail.store.latitude != null && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">{d.storeLocationLabel}</p>
                    <a
                      href={`https://www.google.com/maps?q=${detail.store.latitude},${detail.store.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-500 flex items-center gap-0.5 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Google Maps
                    </a>
                  </div>
                )}

                {/* Store: ingredient list */}
                {detail.kind === "store" && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">{t.common.ingredients}</p>
                    {storeIngredients === null ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    ) : storeIngredients.length === 0 ? (
                      <p className="text-sm text-muted italic">{d.emptyIngredients}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {storeIngredients.map(ing => (
                          <span key={ing.id} className="text-xs px-2.5 py-1 rounded-full bg-elevated border border-border text-foreground">
                            {primaryName(ing.name_th, ing.name_en)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recipes section — border-t only for ingredient (has store chips above it) */}
                {detail.kind !== "store" && (
                  <div className={detail.kind === "ingredient" ? "border-t border-border pt-4" : "pt-1"}>
                    <div className="flex items-center gap-2 mb-3">
                      <ChefHat className="w-3.5 h-3.5 text-muted" />
                      <p className="text-xs font-semibold text-muted uppercase tracking-widest">{t.common.usedInRecipes}</p>
                    </div>
                    {recipes === null ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    ) : recipes.length === 0 ? (
                      <p className="text-sm text-muted italic">—</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {recipes.map(r => (
                          <span key={r.id} className="text-xs px-2.5 py-1 rounded-full bg-elevated border border-border text-foreground">
                            {r.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Store: recipes that use ingredients from this store */}
                {detail.kind === "store" && recipes !== null && recipes.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ChefHat className="w-3.5 h-3.5 text-muted" />
                      <p className="text-xs font-semibold text-muted uppercase tracking-widest">{t.common.usedInRecipes}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recipes.map(r => (
                        <span key={r.id} className="text-xs px-2.5 py-1 rounded-full bg-elevated border border-border text-foreground">
                          {r.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
