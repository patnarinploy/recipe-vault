export type Recipe = {
  id: string;
  user_id: string;
  book_id: string;
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
  sort_order: number | null;
};

export type Book = {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  cover_color: string;
  created_at: string;
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
