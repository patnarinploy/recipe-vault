"use client";

import { useMemo } from "react";
import type { Recipe } from "@/lib/types";
import { useLocale } from "@/lib/locale";

// ─── Parsers ───────────────────────────────────────────────────────────────────

interface InstructionStep { text: string; youtube?: string; image_url?: string | null; }

function parseInstructions(raw: string): InstructionStep[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "text" in parsed[0]) {
      return (parsed as { text?: string; youtube?: string; image_url?: string | null }[])
        .filter(s => s.text?.trim())
        .map(s => ({ text: s.text!.trim(), youtube: s.youtube?.trim() || undefined, image_url: s.image_url || null }));
    }
  } catch {}
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
  const { locale } = useLocale();
  const steps       = useMemo(() => parseInstructions(recipe.instructions), [recipe.instructions]);
  const ingredients = useMemo(() => parseIngredients(recipe.ingredients),   [recipe.ingredients]);

  const cookTime = recipe.cook_time_minutes ? `${recipe.cook_time_minutes} นาที` : "—";
  const servings = recipe.servings          ? `${recipe.servings} ที่`           : "—";
  const category = recipe.preset_categories
    ? (locale === "th" ? recipe.preset_categories.name_th : (recipe.preset_categories.name_en || recipe.preset_categories.name_th))
    : "—";

  return (
    /* Break out of the root layout's px / py */
    <div
      className="-mx-4 sm:-mx-6 -my-10 flex items-stretch"
      style={{ minHeight: "calc(100vh - 4rem)", background: "#0a0500" }}
    >
      {/* ══ Spread wrapper ══════════════════════════════════════════════════════ */}
      <div className="w-full flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 4rem)" }}>

        {/* ══ LEFT PAGE — image + title overlay ══════════════════════════════ */}
        <div
          className="relative overflow-hidden flex flex-col justify-end lg:w-[42%] shrink-0"
          style={{ minHeight: "50vh" }}
        >
          {/* Food image */}
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ filter: "sepia(15%) contrast(1.08)" }}
            />
          ) : (
            <div className="absolute inset-0 bg-stone-800 flex items-center justify-center">
              <span className="text-stone-600 italic text-sm">[ ภาพประกอบ ]</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,191,0,0.08) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.82) 100%)",
            }}
          />

          {/* Text content overlaid at bottom */}
          <div className="relative z-10 p-10 lg:p-14 pb-12 lg:pb-16 text-white">
            <span
              className="block text-[10px] tracking-[4px] uppercase mb-4"
              style={{
                fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
                color: "#ffbf00",
              }}
            >
              {[bookTitle, category !== "—" ? category : null].filter(Boolean).join(" · ") || "Recipe"}
            </span>

            <h1
              className="leading-[0.88] mb-5 font-black"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                textShadow: "2px 4px 24px rgba(0,0,0,0.55)",
              }}
            >
              {recipe.title}
            </h1>

            {recipe.description && (
              <p
                className="text-white/80 leading-relaxed font-light max-w-sm"
                style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}
              >
                {recipe.description}
              </p>
            )}

            {author && (
              <p
                className="mt-4 text-white/45 italic"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "0.8rem",
                }}
              >
                by {author}
              </p>
            )}
          </div>
        </div>

        {/* ══ BOOK GUTTER ════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:block w-10 shrink-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.18) 100%)",
          }}
        />

        {/* ══ RIGHT PAGE — recipe details ════════════════════════════════════ */}
        <div
          className="flex-1 relative overflow-y-auto"
          style={{
            background: "#fffaf0",
            scrollbarWidth: "thin",
            scrollbarColor: "#d4af37 transparent",
          }}
        >
          {/* Bookmark ribbon */}
          <div
            className="absolute top-0 right-8 z-20 w-9 h-28 shadow-lg"
            style={{
              background: "#b22222",
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 87%, 0 100%)",
            }}
          />

          <div className="px-10 py-14 lg:px-16 lg:py-16 max-w-2xl">

            {/* ── Meta grid ─────────────────────────────────────────────── */}
            <div
              className="grid grid-cols-3 gap-6 pb-8 mb-10"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
            >
              {[
                { label: "Prep Time", value: cookTime },
                { label: "Category",  value: category  },
                { label: "Servings",  value: servings  },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <span
                    className="text-[10px] uppercase tracking-[0.28em] text-stone-400"
                    style={{ fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)" }}
                  >
                    {label}
                  </span>
                  <span className="font-bold text-[#2c1e14] text-sm leading-tight">{value}</span>
                </div>
              ))}
            </div>

            {/* ── Ingredients ─────────────────────────────────────────── */}
            {ingredients.length > 0 && (
              <section className="mb-12">
                <SectionHeader>Ingredients</SectionHeader>

                <ul className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6">
                  {ingredients.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#2c1e14]">
                      <span
                        className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#e67e22" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Instructions ─────────────────────────────────────────── */}
            {steps.length > 0 && (
              <section className="mb-20">
                <SectionHeader>Instructions</SectionHeader>

                <div className="mt-6 space-y-8">
                  {steps.map((step, i) => {
                    const embed = step.youtube ? youtubeEmbedUrl(step.youtube) : null;
                    return (
                      <div key={i} className="relative pl-12">
                        {/* Large italic gold step number */}
                        <span
                          className="absolute left-0 select-none"
                          style={{
                            fontFamily: "var(--font-playfair, Georgia, serif)",
                            fontSize: "2.4rem",
                            fontStyle: "italic",
                            color: "#d4af37",
                            opacity: 0.55,
                            lineHeight: 1,
                            top: "-6px",
                          }}
                          aria-hidden
                        >
                          {i + 1}
                        </span>

                        <p
                          className="text-[#2c1e14]"
                          style={{ fontSize: "0.95rem", lineHeight: "1.75" }}
                        >
                          {step.text}
                        </p>

                        {step.image_url && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={step.image_url} alt=""
                              className="rounded-xl shadow-sm"
                              style={{ maxWidth: "100%", maxHeight: "20rem", width: "auto", height: "auto" }} />
                          </div>
                        )}

                        {embed && (
                          <div
                            className="mt-4 rounded-xl overflow-hidden shadow-md"
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
                    );
                  })}
                </div>
              </section>
            )}
          </div>

            {/* ── Recipe-level YouTube video ────────────────────────── */}
            {recipe.youtube_url && (() => {
              const embed = youtubeEmbedUrl(recipe.youtube_url!);
              if (!embed) return null;
              return (
                <section className="mb-20">
                  <SectionHeader>วิดีโอสูตร</SectionHeader>
                  <div className="mt-6 rounded-xl overflow-hidden shadow-md" style={{ aspectRatio: "16/9" }}>
                    <iframe src={embed} title="วิดีโอสูตรอาหาร"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen loading="lazy" className="w-full h-full border-0" />
                  </div>
                </section>
              );
            })()}

          {/* Handwritten note — bottom-right corner */}
          <div
            className="absolute bottom-8 right-10 text-[#4a6fa5] pointer-events-none select-none"
            style={{
              fontFamily: "var(--font-belle-aurore, 'La Belle Aurore', cursive)",
              fontSize: "1.35rem",
              transform: "rotate(-4deg)",
              opacity: 0.75,
            }}
          >
            {bookTitle ? `— ${bookTitle}` : "Bon appétit…"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section header with gold rule ────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2
        className="shrink-0 text-[#2c1e14]"
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: "1.75rem",
          fontWeight: 700,
        }}
      >
        {children}
      </h2>
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to right, #d4af37, transparent)" }}
      />
    </div>
  );
}
