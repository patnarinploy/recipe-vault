import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { type Recipe } from "@/lib/types";
import BookView from "@/components/BookView";

export const revalidate = 0;

export default async function HomePage() {
  const user = await requireSession();
  const supabase = await createClient();

  const [{ data: myRecipes }, { data: publicRecipes }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Recipe[]>(),
    supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .returns<Recipe[]>(),
  ]);

  return (
    <BookView
      myRecipes={myRecipes ?? []}
      publicRecipes={publicRecipes ?? []}
      username={user.username}
    />
  );
}
