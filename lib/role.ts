// Single source of truth for role display labels and badge colors.
// DB values stay as "admin" | "user"; UI always renders these strings.

export const ROLE_LABELS: Record<string, string> = {
  admin: "👑 Admin",
  user:  "📚 Writer",
};

// Color tokens only — each component applies its own size/spacing.
export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-orange-100 text-orange-600 border border-orange-200",
  user:  "bg-stone-100  text-stone-600  border border-stone-200",
};
