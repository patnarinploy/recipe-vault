export type AchievementBadge = {
  id: string;
  label: string;
  emoji: string;
  tooltip: string;
  tier: 1 | 2 | 3 | 4 | 5 | "special";
  category: "book" | "recipe" | "share" | "special";
};

export type AchievementResult = {
  primaryTitle: AchievementBadge | null;
  bookTitle: AchievementBadge | null;
  recipeTitle: AchievementBadge | null;
  shareTitle: AchievementBadge | null;
  specialAchievements: AchievementBadge[];
};

export const TIER_BADGE_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600",
  2: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
  3: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  4: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
  5: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
};

export const SPECIAL_BADGE_COLOR = "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800";

const BOOK_TITLES: Array<{ min: number; id: string; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 10, id: "book-5", label: "ศาสดาแห่งชั้นหนังสือ", emoji: "📚", tier: 5 },
  { min: 6,  id: "book-4", label: "ปรมาจารย์อักษร",       emoji: "🏛️",  tier: 4 },
  { min: 4,  id: "book-3", label: "นักประพันธ์",            emoji: "✍️",  tier: 3 },
  { min: 2,  id: "book-2", label: "รักการเขียน",            emoji: "📝",  tier: 2 },
  { min: 1,  id: "book-1", label: "นักเขียนมือสมัครเล่น",   emoji: "🖊️",  tier: 1 },
];

const RECIPE_TITLES: Array<{ min: number; id: string; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 51, id: "recipe-5", label: "มหาปรมาจารย์แห่งเตาไฟ", emoji: "🔥", tier: 5 },
  { min: 31, id: "recipe-4", label: "เชฟประจำห้องเครื่อง",    emoji: "👨‍🍳", tier: 4 },
  { min: 16, id: "recipe-3", label: "จอมปรุงรส",               emoji: "🍜", tier: 3 },
  { min: 6,  id: "recipe-2", label: "เข้าครัวจริงจัง",         emoji: "🥘", tier: 2 },
  { min: 1,  id: "recipe-1", label: "พ่อครัวฝึกหัด",           emoji: "🍳", tier: 1 },
];

const SHARE_TITLES: Array<{ min: number; id: string; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 31, id: "share-5", label: "ผู้ปลุกยุคแห่งรสชาติ", emoji: "🌟", tier: 5 },
  { min: 16, id: "share-4", label: "ตำนานโต๊ะอาหาร",       emoji: "🏆", tier: 4 },
  { min: 6,  id: "share-3", label: "ขวัญใจมหาชน",          emoji: "💫", tier: 3 },
  { min: 2,  id: "share-2", label: "นักเผยแพร่รสชาติ",     emoji: "📢", tier: 2 },
  { min: 1,  id: "share-1", label: "ผู้กล้าแบ่งปัน",        emoji: "🤝", tier: 1 },
];

// ─── Admin catalog (for display in /admin/achievements) ─────────────────────

export type CatalogEntry = {
  id: string;
  emoji: string;
  label: string;
  tier: 1 | 2 | 3 | 4 | 5 | "special";
  category: "book" | "recipe" | "share" | "special";
  condition: string;
};

export const ACHIEVEMENT_CATALOG: { book: CatalogEntry[]; recipe: CatalogEntry[]; share: CatalogEntry[]; special: CatalogEntry[] } = {
  book: [
    { id: "book-1", emoji: "🖊️",  label: "นักเขียนมือสมัครเล่น",   tier: 1, category: "book",   condition: "มีหนังสือ 1 เล่ม" },
    { id: "book-2", emoji: "📝",  label: "รักการเขียน",            tier: 2, category: "book",   condition: "มีหนังสือ 2–3 เล่ม" },
    { id: "book-3", emoji: "✍️",  label: "นักประพันธ์",             tier: 3, category: "book",   condition: "มีหนังสือ 4–5 เล่ม" },
    { id: "book-4", emoji: "🏛️",  label: "ปรมาจารย์อักษร",          tier: 4, category: "book",   condition: "มีหนังสือ 6–9 เล่ม" },
    { id: "book-5", emoji: "📚",  label: "ศาสดาแห่งชั้นหนังสือ",    tier: 5, category: "book",   condition: "มีหนังสือ 10 เล่มขึ้นไป" },
  ],
  recipe: [
    { id: "recipe-1", emoji: "🍳",  label: "พ่อครัวฝึกหัด",           tier: 1, category: "recipe", condition: "มีสูตรอาหาร 1–5 สูตร" },
    { id: "recipe-2", emoji: "🥘",  label: "เข้าครัวจริงจัง",          tier: 2, category: "recipe", condition: "มีสูตรอาหาร 6–15 สูตร" },
    { id: "recipe-3", emoji: "🍜",  label: "จอมปรุงรส",                tier: 3, category: "recipe", condition: "มีสูตรอาหาร 16–30 สูตร" },
    { id: "recipe-4", emoji: "👨‍🍳", label: "เชฟประจำห้องเครื่อง",     tier: 4, category: "recipe", condition: "มีสูตรอาหาร 31–50 สูตร" },
    { id: "recipe-5", emoji: "🔥",  label: "มหาปรมาจารย์แห่งเตาไฟ",   tier: 5, category: "recipe", condition: "มีสูตรอาหาร 51 สูตรขึ้นไป" },
  ],
  share: [
    { id: "share-1", emoji: "🤝",  label: "ผู้กล้าแบ่งปัน",           tier: 1, category: "share",  condition: "แชร์สูตรสาธารณะ 1 สูตร" },
    { id: "share-2", emoji: "📢",  label: "นักเผยแพร่รสชาติ",          tier: 2, category: "share",  condition: "แชร์สูตรสาธารณะ 2–5 สูตร" },
    { id: "share-3", emoji: "💫",  label: "ขวัญใจมหาชน",              tier: 3, category: "share",  condition: "แชร์สูตรสาธารณะ 6–15 สูตร" },
    { id: "share-4", emoji: "🏆",  label: "ตำนานโต๊ะอาหาร",           tier: 4, category: "share",  condition: "แชร์สูตรสาธารณะ 16–30 สูตร" },
    { id: "share-5", emoji: "🌟",  label: "ผู้ปลุกยุคแห่งรสชาติ",      tier: 5, category: "share",  condition: "แชร์สูตรสาธารณะ 31 สูตรขึ้นไป" },
  ],
  special: [
    { id: "special-complete",    emoji: "⚡",  label: "ครบเครื่อง",    tier: "special", category: "special", condition: "มีหนังสือ + สูตร + แชร์สาธารณะอย่างน้อย 1 อย่างแต่ละประเภท" },
    { id: "special-shadow",      emoji: "🌑",  label: "นักเขียนเงา",   tier: "special", category: "special", condition: "มีหนังสือ 3 เล่มขึ้นไป และยังไม่เคยแชร์สาธารณะ" },
    { id: "special-secret-chef", emoji: "🕵️", label: "เชฟลับ",        tier: "special", category: "special", condition: "มีสูตรอาหาร 15 สูตรขึ้นไป โดยไม่มีหนังสือ" },
    { id: "special-early-bird",  emoji: "🚀",  label: "หน้าใหม่ไฟแรง", tier: "special", category: "special", condition: "แชร์สูตรสาธารณะภายใน 7 วันแรกหลังสมัคร" },
  ],
};

// ─── Runtime calculator ──────────────────────────────────────────────────────

export function getAchievements(stats: {
  book_count?: number;
  recipe_count?: number;
  public_count?: number;
  created_at?: string;
}): AchievementResult {
  const { book_count = 0, recipe_count = 0, public_count = 0, created_at } = stats;

  // Book title — with exact count in tooltip
  let bookTitle: AchievementBadge | null = null;
  for (const t of BOOK_TITLES) {
    if (book_count >= t.min) {
      bookTitle = { id: t.id, label: t.label, emoji: t.emoji, tier: t.tier, category: "book",
                    tooltip: `สร้างหนังสือแล้ว ${book_count} เล่ม` };
      break;
    }
  }

  // Recipe title — with exact count in tooltip
  let recipeTitle: AchievementBadge | null = null;
  for (const t of RECIPE_TITLES) {
    if (recipe_count >= t.min) {
      recipeTitle = { id: t.id, label: t.label, emoji: t.emoji, tier: t.tier, category: "recipe",
                      tooltip: `สร้างสูตรแล้ว ${recipe_count} สูตร` };
      break;
    }
  }

  // Share title — with exact count in tooltip
  let shareTitle: AchievementBadge | null = null;
  for (const t of SHARE_TITLES) {
    if (public_count >= t.min) {
      shareTitle = { id: t.id, label: t.label, emoji: t.emoji, tier: t.tier, category: "share",
                     tooltip: `แชร์สูตรสาธารณะแล้ว ${public_count} สูตร` };
      break;
    }
  }

  // Special achievements — all tooltips include actual counts
  const specialAchievements: AchievementBadge[] = [];
  if (book_count > 0 && recipe_count > 0 && public_count > 0) {
    specialAchievements.push({
      id: "special-complete", label: "ครบเครื่อง", emoji: "⚡", tier: "special", category: "special",
      tooltip: `มีหนังสือ ${book_count} เล่ม สูตร ${recipe_count} สูตร และแชร์แล้ว ${public_count} สูตร`,
    });
  }
  if (book_count >= 3 && public_count === 0) {
    specialAchievements.push({
      id: "special-shadow", label: "นักเขียนเงา", emoji: "🌑", tier: "special", category: "special",
      tooltip: `มีหนังสือ ${book_count} เล่มแต่ยังไม่เคยแชร์สาธารณะ`,
    });
  }
  if (recipe_count >= 15 && book_count === 0) {
    specialAchievements.push({
      id: "special-secret-chef", label: "เชฟลับ", emoji: "🕵️", tier: "special", category: "special",
      tooltip: `มีสูตร ${recipe_count} สูตรโดยไม่มีหนังสือ`,
    });
  }
  if (created_at && public_count > 0) {
    const ageDays = (Date.now() - new Date(created_at).getTime()) / 86_400_000;
    if (ageDays <= 7) {
      specialAchievements.push({
        id: "special-early-bird", label: "หน้าใหม่ไฟแรง", emoji: "🚀", tier: "special", category: "special",
        tooltip: `แชร์สูตรแล้ว ${public_count} สูตรภายใน 7 วันแรกของการสมัคร`,
      });
    }
  }

  // Primary = highest tier; tie-break: book > recipe > share
  let primaryTitle: AchievementBadge | null = null;
  for (const candidate of [bookTitle, recipeTitle, shareTitle]) {
    if (!candidate) continue;
    if (!primaryTitle) { primaryTitle = candidate; continue; }
    if (candidate.tier > primaryTitle.tier) primaryTitle = candidate;
  }

  return { primaryTitle, bookTitle, recipeTitle, shareTitle, specialAchievements };
}
