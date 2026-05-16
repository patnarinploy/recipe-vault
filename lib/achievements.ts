export type AchievementBadge = {
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
  1: "bg-stone-100 text-stone-600 border border-stone-200",
  2: "bg-sky-100 text-sky-700 border border-sky-200",
  3: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  4: "bg-violet-100 text-violet-700 border border-violet-200",
  5: "bg-amber-100 text-amber-700 border border-amber-200",
};

export const SPECIAL_BADGE_COLOR = "bg-rose-100 text-rose-700 border border-rose-200";

const BOOK_TITLES: Array<{ min: number; badge: AchievementBadge }> = [
  { min: 10, badge: { label: "ศาสดาแห่งชั้นหนังสือ", emoji: "📚", tooltip: "สร้างหนังสือ 10 เล่มขึ้นไป", tier: 5, category: "book" } },
  { min: 6,  badge: { label: "ปรมาจารย์อักษร",       emoji: "🏛️",  tooltip: "สร้างหนังสือ 6–9 เล่ม",      tier: 4, category: "book" } },
  { min: 4,  badge: { label: "นักประพันธ์",            emoji: "✍️",  tooltip: "สร้างหนังสือ 4–5 เล่ม",      tier: 3, category: "book" } },
  { min: 2,  badge: { label: "รักการเขียน",            emoji: "📝",  tooltip: "สร้างหนังสือ 2–3 เล่ม",      tier: 2, category: "book" } },
  { min: 1,  badge: { label: "นักเขียนมือสมัครเล่น",   emoji: "🖊️",  tooltip: "สร้างหนังสือ 1 เล่ม",        tier: 1, category: "book" } },
];

const RECIPE_TITLES: Array<{ min: number; badge: AchievementBadge }> = [
  { min: 51, badge: { label: "มหาปรมาจารย์แห่งเตาไฟ", emoji: "🔥", tooltip: "มีสูตรอาหาร 51 สูตรขึ้นไป", tier: 5, category: "recipe" } },
  { min: 31, badge: { label: "เชฟประจำห้องเครื่อง",    emoji: "👨‍🍳", tooltip: "มีสูตรอาหาร 31–50 สูตร",   tier: 4, category: "recipe" } },
  { min: 16, badge: { label: "จอมปรุงรส",               emoji: "🍜", tooltip: "มีสูตรอาหาร 16–30 สูตร",   tier: 3, category: "recipe" } },
  { min: 6,  badge: { label: "เข้าครัวจริงจัง",         emoji: "🥘", tooltip: "มีสูตรอาหาร 6–15 สูตร",    tier: 2, category: "recipe" } },
  { min: 1,  badge: { label: "พ่อครัวฝึกหัด",           emoji: "🍳", tooltip: "มีสูตรอาหาร 1–5 สูตร",     tier: 1, category: "recipe" } },
];

const SHARE_TITLES: Array<{ min: number; badge: AchievementBadge }> = [
  { min: 31, badge: { label: "ผู้ปลุกยุคแห่งรสชาติ", emoji: "🌟", tooltip: "แชร์สูตร 31 สูตรขึ้นไป",  tier: 5, category: "share" } },
  { min: 16, badge: { label: "ตำนานโต๊ะอาหาร",       emoji: "🏆", tooltip: "แชร์สูตร 16–30 สูตร",     tier: 4, category: "share" } },
  { min: 6,  badge: { label: "ขวัญใจมหาชน",          emoji: "💫", tooltip: "แชร์สูตร 6–15 สูตร",      tier: 3, category: "share" } },
  { min: 2,  badge: { label: "นักเผยแพร่รสชาติ",     emoji: "📢", tooltip: "แชร์สูตร 2–5 สูตร",       tier: 2, category: "share" } },
  { min: 1,  badge: { label: "ผู้กล้าแบ่งปัน",        emoji: "🤝", tooltip: "แชร์สูตรแรกแล้ว",         tier: 1, category: "share" } },
];

export function getBookTitle(count: number): AchievementBadge | null {
  for (const { min, badge } of BOOK_TITLES) {
    if (count >= min) return badge;
  }
  return null;
}

export function getRecipeTitle(count: number): AchievementBadge | null {
  for (const { min, badge } of RECIPE_TITLES) {
    if (count >= min) return badge;
  }
  return null;
}

export function getShareTitle(count: number): AchievementBadge | null {
  for (const { min, badge } of SHARE_TITLES) {
    if (count >= min) return badge;
  }
  return null;
}

export function getSpecialAchievements({
  book_count = 0,
  recipe_count = 0,
  public_count = 0,
  created_at,
}: {
  book_count?: number;
  recipe_count?: number;
  public_count?: number;
  created_at?: string;
}): AchievementBadge[] {
  const results: AchievementBadge[] = [];

  if (book_count > 0 && recipe_count > 0 && public_count > 0) {
    results.push({ label: "ครบเครื่อง", emoji: "⚡", tooltip: "มีทั้งหนังสือ สูตรอาหาร และแชร์ครบ", tier: "special", category: "special" });
  }
  if (book_count >= 3 && public_count === 0) {
    results.push({ label: "นักเขียนเงา", emoji: "🌑", tooltip: "มีหนังสือ 3 เล่มขึ้นไปแต่ยังไม่เคยแชร์", tier: "special", category: "special" });
  }
  if (recipe_count >= 15 && book_count === 0) {
    results.push({ label: "เชฟลับ", emoji: "🕵️", tooltip: "มีสูตรมากกว่า 15 สูตรโดยไม่มีหนังสือ", tier: "special", category: "special" });
  }
  if (created_at && public_count > 0) {
    const ageDays = (Date.now() - new Date(created_at).getTime()) / 86_400_000;
    if (ageDays <= 7) {
      results.push({ label: "หน้าใหม่ไฟแรง", emoji: "🚀", tooltip: "แชร์สูตรภายใน 7 วันแรกของการสมัคร", tier: "special", category: "special" });
    }
  }

  return results;
}

export function getAchievements(stats: {
  book_count?: number;
  recipe_count?: number;
  public_count?: number;
  created_at?: string;
}): AchievementResult {
  const { book_count = 0, recipe_count = 0, public_count = 0, created_at } = stats;

  const bookTitle   = getBookTitle(book_count);
  const recipeTitle = getRecipeTitle(recipe_count);
  const shareTitle  = getShareTitle(public_count);
  const specialAchievements = getSpecialAchievements({ book_count, recipe_count, public_count, created_at });

  // Highest tier wins; tie-break: Book > Recipe > Share (order of candidates)
  let primaryTitle: AchievementBadge | null = null;
  for (const candidate of [bookTitle, recipeTitle, shareTitle]) {
    if (!candidate) continue;
    if (!primaryTitle) { primaryTitle = candidate; continue; }
    const cTier = candidate.tier === "special" ? 99 : candidate.tier;
    const pTier = primaryTitle.tier === "special" ? 99 : primaryTitle.tier;
    if (cTier > pTier) primaryTitle = candidate;
  }

  return { primaryTitle, bookTitle, recipeTitle, shareTitle, specialAchievements };
}
