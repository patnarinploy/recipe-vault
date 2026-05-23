"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleFollow(
  targetUserId: string,
): Promise<{ following: boolean } | { error: string }> {
  const user = await getSession();
  if (!user) return { error: "not_authenticated" };
  if (user.id === targetUserId) return { error: "cannot_follow_self" };

  const sb = await createClient();
  const { data: existing } = await sb
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb.from("user_follows").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/");
    return { following: false };
  } else {
    const { error } = await sb
      .from("user_follows")
      .insert({ follower_id: user.id, following_id: targetUserId });
    if (error) return { error: error.message };
    revalidatePath("/");
    return { following: true };
  }
}

export async function getFollowerCount(userId: string): Promise<number> {
  const sb = await createClient();
  const { count } = await sb
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowStatus(targetUserId: string): Promise<boolean> {
  const user = await getSession();
  if (!user) return false;
  const sb = await createClient();
  const { data } = await sb
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return !!data;
}
