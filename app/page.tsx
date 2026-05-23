import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import Library from "@/components/Library";
import { SkeletonBookGrid } from "@/components/Skeleton";
import type { Book, WriterInfo } from "@/lib/types";
import { getFavoriteCount } from "@/app/actions/favorites";
import { getShoppingListCount } from "@/app/actions/shopping";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getFollowStatus } from "@/app/actions/follow";

export const revalidate = 0;

type BookWithCounts = Book & { recipe_count: number; public_count: number; bookAuthor?: WriterInfo };

async function BookLibraryData({ userId }: { userId: string | null }) {
  const supabase = await createClient();

  // My books — only for authenticated users
  let myBooks: BookWithCounts[] = [];
  if (userId) {
    const { data: myBooksRaw } = await supabase
      .from("books").select("*").eq("user_id", userId)
      .order("created_at", { ascending: true }).returns<Book[]>();

    const myBookIds = (myBooksRaw ?? []).map(b => b.id);
    const { data: myRecipes } = myBookIds.length
      ? await supabase.from("recipes").select("book_id, is_public").in("book_id", myBookIds).returns<{ book_id: string; is_public: boolean }[]>()
      : { data: [] };

    myBooks = (myBooksRaw ?? []).map(b => {
      const list = (myRecipes ?? []).filter(r => r.book_id === b.id);
      return { ...b, recipe_count: list.length, public_count: list.filter(r => r.is_public).length };
    });
  }

  // Public books — available to guests and authenticated users
  const { data: publicRecipes } = await supabase
    .from("recipes").select("book_id").eq("is_public", true).returns<{ book_id: string }[]>();
  const publicBookIds = Array.from(new Set((publicRecipes ?? []).map(r => r.book_id)));

  type PublicBookRaw = Book & { users: Omit<WriterInfo, "book_count" | "recipe_count" | "public_count"> };
  const { data: publicBooksRaw } = publicBookIds.length
    ? await supabase.from("books")
        .select("*, users(display_name, bio, avatar, role, last_seen, created_at)")
        .in("id", publicBookIds).order("created_at", { ascending: true }).returns<PublicBookRaw[]>()
    : { data: [] };

  const authorPublicStats = new Map<string, { book_count: number; recipe_count: number; public_count: number }>();
  for (const b of publicBooksRaw ?? []) {
    const uid: string | undefined = (b as any).user_id;
    if (!uid) continue;
    const cnt  = (publicRecipes ?? []).filter(r => r.book_id === b.id).length;
    const prev = authorPublicStats.get(uid) ?? { book_count: 0, recipe_count: 0, public_count: 0 };
    authorPublicStats.set(uid, { book_count: prev.book_count + 1, recipe_count: prev.recipe_count + cnt, public_count: prev.public_count + cnt });
  }

  const publicBooks: BookWithCounts[] = (publicBooksRaw ?? []).map(b => {
    const count  = (publicRecipes ?? []).filter(r => r.book_id === b.id).length;
    const uid: string | undefined = (b as any).user_id;
    const stats  = uid ? authorPublicStats.get(uid) : undefined;
    const bookAuthor: WriterInfo | undefined = (b as any).users ? { ...(b as any).users, ...stats, user_id: (b as any).user_id } : undefined;
    return { ...b, recipe_count: count, public_count: count, bookAuthor };
  });

  return { myBooks, publicBooks };
}

async function LibraryWithData({ userId, currentUser }: { userId: string | null; currentUser: WriterInfo | null }) {
  const [{ myBooks, publicBooks }, favoriteCount, shoppingCount] = await Promise.all([
    BookLibraryData({ userId }),
    userId ? getFavoriteCount() : Promise.resolve(0),
    userId ? getShoppingListCount() : Promise.resolve(0),
  ]);
  const enrichedUser: WriterInfo | null = currentUser
    ? { ...currentUser, book_count: myBooks.length, recipe_count: myBooks.reduce((s, b) => s + b.recipe_count, 0), public_count: myBooks.reduce((s, b) => s + b.public_count, 0) }
    : null;
  return <Library myBooks={myBooks} publicBooks={publicBooks} currentUser={enrichedUser} favoriteCount={favoriteCount} shoppingCount={shoppingCount} />;
}

export default async function HomePage() {
  const user = await getSession();

  const currentUser: WriterInfo | null = user
    ? { display_name: user.display_name, bio: user.bio, avatar: user.avatar, role: user.role, last_seen: user.last_seen, created_at: user.created_at }
    : null;

  return (
    <Suspense fallback={
      <div className="anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-4 w-40 rounded" />
          </div>
        </div>
        <div className="flex gap-2 mb-8 border-b border-outline">
          <div className="skeleton h-10 w-28 rounded-t-lg" />
          <div className="skeleton h-10 w-28 rounded-t-lg opacity-50" />
        </div>
        <SkeletonBookGrid count={8} />
      </div>
    }>
      <LibraryWithData userId={user?.id ?? null} currentUser={currentUser} />
    </Suspense>
  );
}
