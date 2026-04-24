import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";
import BookReader from "@/components/BookReader";
import type { Book, Recipe } from "@/lib/types";

export const revalidate = 0;

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const user = await requireSession();
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single<Book>();

  if (!book) notFound();

  const isOwner = book.user_id === user.id;
  const publicOnly = view === "public" || !isOwner;

  // If viewing someone else's book, must have at least 1 public recipe
  if (!isOwner) {
    const { count } = await supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("book_id", id)
      .eq("is_public", true);
    if (!count) notFound();
  }

  let q = supabase
    .from("recipes")
    .select("*")
    .eq("book_id", id)
    .order("created_at", { ascending: true });
  if (publicOnly) q = q.eq("is_public", true);

  const { data: recipes } = await q.returns<Recipe[]>();

  return (
    <BookReader book={book} recipes={recipes ?? []} isOwner={isOwner} />
  );
}
