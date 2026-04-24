"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { Book, Recipe } from "@/lib/types";

type BookPayload = {
  title: string;
  subtitle: string | null;
  tagline: string | null;
  cover_color: string;
};

export async function createBook(
  payload: BookPayload
): Promise<{ id: string } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .insert({ ...payload, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateBook(
  id: string,
  payload: Partial<BookPayload>
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("books")
    .select("user_id")
    .eq("id", id)
    .single<Pick<Book, "user_id">>();

  if (!existing || existing.user_id !== user.id) return { error: "ไม่มีสิทธิ์แก้ไข" };

  const { error } = await supabase.from("books").update(payload).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getBookWithRecipes(
  id: string
): Promise<
  { book: Book; recipes: Recipe[]; isOwner: boolean } | { error: string }
> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single<Book>();

  if (!book) return { error: "ไม่พบหนังสือ" };

  const isOwner = book.user_id === user.id;

  let q = supabase
    .from("recipes")
    .select("*")
    .eq("book_id", id)
    .order("created_at", { ascending: true });
  if (!isOwner) q = q.eq("is_public", true);

  const { data: recipes } = await q.returns<Recipe[]>();

  if (!isOwner && (!recipes || recipes.length === 0)) {
    return { error: "หนังสือนี้ไม่มีสูตรสาธารณะ" };
  }

  return { book, recipes: recipes ?? [], isOwner };
}

export async function deleteBook(
  id: string
): Promise<{ success: true } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("books")
    .select("user_id")
    .eq("id", id)
    .single<Pick<Book, "user_id">>();

  if (!existing || existing.user_id !== user.id) return { error: "ไม่มีสิทธิ์ลบ" };

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
