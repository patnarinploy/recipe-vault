"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function getMyStats(): Promise<{ book_count: number; recipe_count: number; public_count: number; follower_count: number }> {
  const user = await getSession();
  if (!user) return { book_count: 0, recipe_count: 0, public_count: 0, follower_count: 0 };

  const supabase = await createClient();

  const [booksRes, followerRes] = await Promise.all([
    supabase.from("books").select("id").eq("user_id", user.id),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
  ]);

  const bkIds = (booksRes.data ?? []).map((b: { id: string }) => b.id);
  const follower_count = followerRes.count ?? 0;

  if (!bkIds.length) return { book_count: 0, recipe_count: 0, public_count: 0, follower_count };

  const [recipeRes, publicRes] = await Promise.all([
    supabase.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds),
    supabase.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds).eq("is_public", true),
  ]);

  return {
    book_count:   bkIds.length,
    recipe_count: recipeRes.count ?? 0,
    public_count: publicRes.count ?? 0,
    follower_count,
  };
}
