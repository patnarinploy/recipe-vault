// Single source of truth for role display labels and badge colors.
// DB values stay as "admin" | "user"; UI always renders these strings.

export const ROLE_LABELS: Record<string, string> = {
  admin: "👑 Admin",
  user:  "📚 Writer",
};

// Color tokens only — each component applies its own size/spacing.
export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
  user:  "bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600",
};
