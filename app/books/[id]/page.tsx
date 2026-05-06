import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import BookViewer from "./BookViewer";
import type { Book, Recipe, WriterInfo } from "@/lib/types";

export const revalidate = 0;

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const { id } = await params;
  const { add } = await searchParams;

  const supabase = await createClient();
  const session = await getSession();

  const { data: book } = await supabase.from("books").select("*").eq("id", id).single<Book>();
  if (!book) notFound();

  const isOwner = session?.id === book.user_id;

  const { data: recipesRaw } = await supabase
    .from("recipes")
    .select("*")
    .eq("book_id", id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<Recipe[]>();

  const recipes = isOwner
    ? (recipesRaw ?? [])
    : (recipesRaw ?? []).filter((r) => r.is_public);

  if (!isOwner && recipes.length === 0) notFound();

  const { data: author } = await supabase
    .from("users")
    .select("username, display_name, bio, avatar, role")
    .eq("id", book.user_id)
    .single<WriterInfo>();

  return (
    <BookViewer
      book={book}
      initialRecipes={recipes}
      isOwner={isOwner}
      author={author ?? undefined}
      autoAdd={add === "1"}
    />
  );
}
