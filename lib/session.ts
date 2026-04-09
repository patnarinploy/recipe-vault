import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./auth";
import { createClient } from "./supabase/server";
import { redirect } from "next/navigation";
import type { User } from "./types";

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, role, created_at")
    .eq("id", userId)
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
