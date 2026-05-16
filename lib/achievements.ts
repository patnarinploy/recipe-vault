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

const BOOK_TITLES: Array<{ min: number; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 10, label: "ศาสดาแห่งชั้นหนังสือ", emoji: "📚", tier: 5 },
  { min: 6,  label: "ปรมาจารย์อักษร",       emoji: "🏛️",  tier: 4 },
  { min: 4,  label: "นักประพันธ์",            emoji: "✍️",  tier: 3 },
  { min: 2,  label: "รักการเขียน",            emoji: "📝",  tier: 2 },
  { min: 1,  label: "นักเขียนมือสมัครเล่น",   emoji: "🖊️",  tier: 1 },
];

const RECIPE_TITLES: Array<{ min: number; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 51, label: "มหาปรมาจารย์แห่งเตาไฟ", emoji: "🔥", tier: 5 },
  { min: 31, label: "เชฟประจำห้องเครื่อง",    emoji: "👨‍🍳", tier: 4 },
  { min: 16, label: "จอมปรุงรส",               emoji: "🍜", tier: 3 },
  { min: 6,  label: "เข้าครัวจริงจัง",         emoji: "🥘", tier: 2 },
  { min: 1,  label: "พ่อครัวฝึกหัด",           emoji: "🍳", tier: 1 },
];

const SHARE_TITLES: Array<{ min: number; label: string; emoji: string; tier: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 31, label: "ผู้ปลุกยุคแห่งรสชาติ", emoji: "🌟", tier: 5 },
  { min: 16, label: "ตำนานโต๊ะอาหาร",       emoji: "🏆", tier: 4 },
  { min: 6,  label: "ขวัญใจมหาชน",          emoji: "💫", tier: 3 },
  { min: 2,  label: "นักเผยแพร่รสชาติ",     emoji: "📢", tier: 2 },
  { min: 1,  label: "ผู้กล้าแบ่งปัน",        emoji: "🤝", tier: 1 },
];

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
      bookTitle = { label: t.label, emoji: t.emoji, tier: t.tier, category: "book",
                    tooltip: `สร้างหนังสือแล้ว ${book_count} เล่ม` };
      break;
    }
  }

  // Recipe title — with exact count in tooltip
  let recipeTitle: AchievementBadge | null = null;
  for (const t of RECIPE_TITLES) {
    if (recipe_count >= t.min) {
      recipeTitle = { label: t.label, emoji: t.emoji, tier: t.tier, category: "recipe",
                      tooltip: `สร้างสูตรแล้ว ${recipe_count} สูตร` };
      break;
    }
  }

  // Share title — with exact count in tooltip
  let shareTitle: AchievementBadge | null = null;
  for (const t of SHARE_TITLES) {
    if (public_count >= t.min) {
      shareTitle = { label: t.label, emoji: t.emoji, tier: t.tier, category: "share",
                     tooltip: `แชร์สูตรสาธารณะแล้ว ${public_count} สูตร` };
      break;
    }
  }

  // Special achievements — all tooltips include actual counts
  const specialAchievements: AchievementBadge[] = [];
  if (book_count > 0 && recipe_count > 0 && public_count > 0) {
    specialAchievements.push({
      label: "ครบเครื่อง", emoji: "⚡", tier: "special", category: "special",
      tooltip: `มีหนังสือ ${book_count} เล่ม สูตร ${recipe_count} สูตร และแชร์แล้ว ${public_count} สูตร`,
    });
  }
  if (book_count >= 3 && public_count === 0) {
    specialAchievements.push({
      label: "นักเขียนเงา", emoji: "🌑", tier: "special", category: "special",
      tooltip: `มีหนังสือ ${book_count} เล่มแต่ยังไม่เคยแชร์สาธารณะ`,
    });
  }
  if (recipe_count >= 15 && book_count === 0) {
    specialAchievements.push({
      label: "เชฟลับ", emoji: "🕵️", tier: "special", category: "special",
      tooltip: `มีสูตร ${recipe_count} สูตรโดยไม่มีหนังสือ`,
    });
  }
  if (created_at && public_count > 0) {
    const ageDays = (Date.now() - new Date(created_at).getTime()) / 86_400_000;
    if (ageDays <= 7) {
      specialAchievements.push({
        label: "หน้าใหม่ไฟแรง", emoji: "🚀", tier: "special", category: "special",
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
