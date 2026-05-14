import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";

export async function getSession(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single<User>();

  return data ?? null;
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
