import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import Library from "@/components/Library";
import type { Book, WriterInfo } from "@/lib/types";

export const revalidate = 0;

type BookWithCounts = Book & { recipe_count: number; public_count: number; bookAuthor?: WriterInfo };

export default async function HomePage() {
  const user = await requireSession();
  const supabase = await createClient();

  // My books
  const { data: myBooksRaw } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<Book[]>();

  const myBookIds = (myBooksRaw ?? []).map((b) => b.id);

  const { data: myRecipes } = myBookIds.length
    ? await supabase
        .from("recipes")
        .select("book_id, is_public")
        .in("book_id", myBookIds)
        .returns<{ book_id: string; is_public: boolean }[]>()
    : { data: [] };

  const myBooks: BookWithCounts[] = (myBooksRaw ?? []).map((b) => {
    const list = (myRecipes ?? []).filter((r) => r.book_id === b.id);
    return { ...b, recipe_count: list.length, public_count: list.filter((r) => r.is_public).length };
  });

  // Public books (with author info)
  const { data: publicRecipes } = await supabase
    .from("recipes")
    .select("book_id")
    .eq("is_public", true)
    .returns<{ book_id: string }[]>();

  const publicBookIds = Array.from(new Set((publicRecipes ?? []).map((r) => r.book_id)));

  type PublicBookRaw = Book & { users: WriterInfo };
  const { data: publicBooksRaw } = publicBookIds.length
    ? await supabase
        .from("books")
        .select("*, users(username, display_name, bio, avatar, role)")
        .in("id", publicBookIds)
        .order("created_at", { ascending: true })
        .returns<PublicBookRaw[]>()
    : { data: [] };

  const publicBooks: BookWithCounts[] = (publicBooksRaw ?? []).map((b) => {
    const count = (publicRecipes ?? []).filter((r) => r.book_id === b.id).length;
    return { ...b, recipe_count: count, public_count: count, bookAuthor: (b as any).users ?? undefined };
  });

  const currentUser: WriterInfo = {
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
  };

  return (
    <Library myBooks={myBooks} publicBooks={publicBooks} currentUser={currentUser} />
  );
}
