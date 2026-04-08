export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  category: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  created_at: string;
  updated_at: string;
};

export type RecipeInsert = Omit<Recipe, "id" | "created_at" | "updated_at">;

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export const RECIPE_CATEGORIES = [
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

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
