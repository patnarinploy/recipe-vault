"use client";

import { useMemo } from "react";
import type { Recipe } from "@/lib/types";

// ─── Data parsers ──────────────────────────────────────────────────────────────

interface InstructionStep { text: string; youtube?: string; }

function parseInstructions(raw: string): InstructionStep[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "text" in parsed[0]) {
      return (parsed as { text?: string; youtube?: string }[])
        .filter(s => s.text?.trim())
        .map(s => ({ text: s.text!.trim(), youtube: s.youtube?.trim() || undefined }));
    }
  } catch {}
  // Legacy plain-text fallback
  return raw.split("\n").filter(l => l.trim()).map(line => ({
    text: line.replace(/^\d+\.\s*/, "").trim(),
  }));
}

function parseIngredients(raw: string): string[] {
  return raw.split("\n").map(l => l.trim()).filter(Boolean);
}

function youtubeEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  const m =
    url.match(/[?&]v=([^&\s]+)/) ||
    url.match(/youtu\.be\/([^?&\s]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&\s]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-10 h-px bg-stone-300 my-3" />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl font-bold italic text-stone-800"
      style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)" }}
    >
      {children}
    </h2>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function RecipeViewV2({
  recipe,
  author,
  bookTitle,
}: {
  recipe: Recipe;
  author?: string;
  bookTitle?: string;
}) {
  const steps       = useMemo(() => parseInstructions(recipe.instructions), [recipe.instructions]);
  const ingredients = useMemo(() => parseIngredients(recipe.ingredients),   [recipe.ingredients]);

  const meta = [
    bookTitle,
    recipe.category,
    recipe.cook_time_minutes ? `${recipe.cook_time_minutes} นาที` : null,
    recipe.servings           ? `${recipe.servings} ที่`           : null,
  ].filter(Boolean).join(" — ");

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* ── Wrapper: stacked on mobile, split on lg+ ── */}
      <div className="max-w-5xl mx-auto lg:flex lg:h-screen lg:overflow-hidden">

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <aside className="lg:w-[40%] lg:h-screen lg:flex lg:flex-col lg:overflow-hidden bg-[#eeebe3] shrink-0">

          {/* Image — magazine rectangular crop */}
          <div
            className="relative overflow-hidden shrink-0"
            style={{ height: "clamp(200px,38vh,340px)" }}
          >
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none select-none"
                style={{ objectPosition: "center 30%" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-200">
                <span className="text-stone-400 text-sm italic tracking-wide">[ ภาพประกอบ ]</span>
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="flex-1 flex flex-col justify-between px-8 py-8 lg:px-10 lg:py-10">
            <div>
              <h1
                className="text-4xl lg:text-[2.75rem] font-bold leading-[1.15] text-stone-800"
                style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)" }}
              >
                {recipe.title}
              </h1>

              {recipe.description && (
                <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-xs">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* Metadata footer */}
            <div className="border-t border-stone-300/60 pt-4 mt-6">
              {meta && (
                <p className="text-[10px] tracking-[0.28em] uppercase text-stone-400 leading-relaxed">
                  {meta}
                </p>
              )}
              {author && (
                <p className="text-[11px] italic text-stone-400 mt-1">by {author}</p>
              )}
            </div>
          </div>
        </aside>

        {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
        <main className="lg:flex-1 lg:overflow-y-auto px-6 py-10 lg:px-14 lg:py-16">

          {/* ── Ingredients ─────────────────────────────────────────────── */}
          {ingredients.length > 0 && (
            <section className="mb-14">
              <SectionHeading>Ingredients</SectionHeading>
              <Divider />

              <div className="grid grid-cols-2 gap-x-10">
                {ingredients.map((item, i) => (
                  <div
                    key={i}
                    className="py-3 border-b border-dashed border-stone-200 last:border-0"
                  >
                    <p className="text-sm text-stone-700 leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Preparation ─────────────────────────────────────────────── */}
          {steps.length > 0 && (
            <section>
              <SectionHeading>Preparation</SectionHeading>
              <Divider />

              <div className="space-y-9">
                {steps.map((step, i) => {
                  const embed = step.youtube ? youtubeEmbedUrl(step.youtube) : null;
                  return (
                    <div key={i} className="flex gap-5">

                      {/* Step number */}
                      <span
                        className="shrink-0 text-[11px] font-semibold tracking-wider text-stone-300 pt-0.5 w-6 text-right"
                        style={{ fontFamily: "Georgia,serif" }}
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      {/* Step body */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-600 leading-[1.85]">{step.text}</p>

                        {/* YouTube embed — only rendered when a valid URL exists */}
                        {embed && (
                          <div
                            className="mt-4 rounded-xl overflow-hidden bg-stone-200 shadow-sm"
                            style={{ aspectRatio: "16/9" }}
                          >
                            <iframe
                              src={embed}
                              title={`วิดีโอขั้นตอน ${i + 1}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                              className="w-full h-full border-0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom breathing room */}
          <div className="h-16" />
        </main>
      </div>
    </div>
  );
}
