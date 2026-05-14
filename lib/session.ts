import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";

export async function getSession(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Primary lookup: match by auth_id
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single<User>();

  if (data) return data;

  // Fallback: same email linked to a different auth_id
  // (happens when the same person signs in via a second OAuth provider)
  if (!authUser.email) return null;

  const { data: byEmail } = await supabase
    .from("users")
    .select("*")
    .eq("email", authUser.email)
    .single<User>();

  if (!byEmail) return null;

  // Re-link this auth_id to the existing profile so future lookups hit the fast path
  await supabase
    .from("users")
    .update({ auth_id: authUser.id, auth_provider: authUser.app_metadata?.provider ?? null })
    .eq("id", byEmail.id);

  return { ...byEmail, auth_id: authUser.id };
}

export async function requireSession(): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user as User;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireSession();
  if (user.role !== "admin") redirect("/");
  return user;
}
