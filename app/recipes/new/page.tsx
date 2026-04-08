import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มสูตรอาหารใหม่</h1>
      <RecipeForm userId={user.id} />
    </div>
  );
}
