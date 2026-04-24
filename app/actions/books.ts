"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { Book } from "@/lib/types";

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
