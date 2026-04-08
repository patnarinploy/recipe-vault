export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  category: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  created_at: string;
};

export type RecipeFormData = Omit<Recipe, "id" | "created_at">;

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
