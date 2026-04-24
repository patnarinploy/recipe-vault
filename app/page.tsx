import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import Library from "@/components/Library";
import type { Book } from "@/lib/types";

export const revalidate = 0;

type BookWithCounts = Book & { recipe_count: number; public_count: number };

export default async function HomePage() {
  const user = await requireSession();
  const supabase = await createClient();

  // Fetch user's books with recipe counts
  const { data: myBooksRaw } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<Book[]>();

  const myBookIds = (myBooksRaw ?? []).map((b) => b.id);

  // Counts per book (my books)
  const { data: myRecipes } = myBookIds.length
    ? await supabase
        .from("recipes")
        .select("book_id, is_public")
        .in("book_id", myBookIds)
        .returns<{ book_id: string; is_public: boolean }[]>()
    : { data: [] };

  const myBooks: BookWithCounts[] = (myBooksRaw ?? []).map((b) => {
    const list = (myRecipes ?? []).filter((r) => r.book_id === b.id);
    return {
      ...b,
      recipe_count: list.length,
      public_count: list.filter((r) => r.is_public).length,
    };
  });

  // Public view: fetch all books that have at least 1 public recipe
  const { data: publicRecipes } = await supabase
    .from("recipes")
    .select("book_id")
    .eq("is_public", true)
    .returns<{ book_id: string }[]>();

  const publicBookIds = Array.from(new Set((publicRecipes ?? []).map((r) => r.book_id)));

  const { data: publicBooksRaw } = publicBookIds.length
    ? await supabase
        .from("books")
        .select("*")
        .in("id", publicBookIds)
        .order("created_at", { ascending: true })
        .returns<Book[]>()
    : { data: [] };

  const publicBooks: BookWithCounts[] = (publicBooksRaw ?? []).map((b) => {
    const count = (publicRecipes ?? []).filter((r) => r.book_id === b.id).length;
    return { ...b, recipe_count: count, public_count: count };
  });

  return (
    <Library myBooks={myBooks} publicBooks={publicBooks} username={user.username} />
  );
}
