export type PresetUnit = {
  id: string;
  unit_name_th: string;
  unit_name_en: string;
  is_active: boolean;
  user_id: string | null;
  created_at?: string;
};

export type PresetCategory = {
  id: string;
  name_th: string;
  name_en: string;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
};

export type DbIngredient = {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  ingredient_amount: string;
  ingredient_unit_id: string | null;
  ingredient_sort: number;
  preset_units: PresetUnit | null;
};

export type Recipe = {
  id: string;
  user_id: string;
  book_id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  youtube_url: string | null;
  category_id: string | null;
  preset_categories?: PresetCategory | null;
  cook_time_minutes: number | null;
  servings: number | null;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  sort_order: number | null;
  ingredient_rows?: DbIngredient[];
};

export type Book = {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  cover_color: string;
  created_at: string;
  updated_at?: string;
};

export const BOOK_COLORS = [
  { name: "Sage",     value: "#6b7c5b" },
  { name: "Terracotta", value: "#b2613e" },
  { name: "Mustard",  value: "#c8934a" },
  { name: "Dusty Rose", value: "#b07a7a" },
  { name: "Ocean",    value: "#4a6785" },
  { name: "Lavender", value: "#8a7aa8" },
  { name: "Charcoal", value: "#4a4a4a" },
  { name: "Cream",    value: "#c9a876" },
] as const;

export type WriterInfo = {
  display_name: string | null;
  bio: string | null;
  avatar: string | null;
  role?: "admin" | "user";
  status?: "active" | "banned";
  book_count?: number;
  recipe_count?: number;
  public_count?: number;
  last_seen?: string | null;
  created_at?: string;
};

export type User = {
  id: string;
  auth_id: string | null;
  auth_provider: string | null;
  display_name: string | null;
  bio: string | null;
  email: string | null;
  tel: string | null;
  role: "admin" | "user";
  status: "active" | "banned";
  banned_at: string | null;
  banned_reason: string | null;
  banned_by: string | null;
  onboarding_complete: boolean;
  last_seen: string | null;
  avatar: string | null;
  dob: string | null;
  country: string | null;
  language: string | null;
  social_links: Record<string, string> | null;
  preferences: Record<string, string> | null;
  created_at: string;
};

export const CATEGORIES = [
  "อาหารไทย",
  "อาหารจีน",
  "อาหารญี่ปุ่น",
  "อาหารตะวันตก",
  "อาหารอิตาลี",
  "อาหารอินเดีย",
  "ของหวาน",
  "เครื่องดื่ม",
  "อื่นๆ",
] as const;
