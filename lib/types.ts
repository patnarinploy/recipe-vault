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
  is_public: boolean;
  created_at: string;
};

export type User = {
  id: string;
  username: string;
  role: "admin" | "user";
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
