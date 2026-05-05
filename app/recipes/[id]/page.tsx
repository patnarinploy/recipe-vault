import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import RecipeViewV2 from "@/components/RecipeViewV2";
import type { Recipe, Book, WriterInfo } from "@/lib/types";

export const revalidate = 0;

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const session = await getSession();

  // Fetch recipe
  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();

  // Access control: public recipes are open to all; private only to owner
  if (!recipe.is_public && recipe.user_id !== session?.id) notFound();

  // Fetch book and author in parallel
  const [{ data: book }, { data: author }] = await Promise.all([
    supabase.from("books").select("*").eq("id", recipe.book_id).single<Book>(),
    supabase
      .from("users")
      .select("username, display_name, bio, avatar, role")
      .eq("id", recipe.user_id)
      .single<WriterInfo>(),
  ]);

  return (
    <RecipeViewV2
      recipe={recipe}
      author={author?.display_name ?? author?.username}
      bookTitle={book?.title}
    />
  );
}
