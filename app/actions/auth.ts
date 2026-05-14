"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

// ─── Session ──────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── Profile mutations ────────────────────────────────────────────────────────

export async function updatePublicProfile(
  _: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true } | undefined> {
  const currentUser = await getSession();
  if (!currentUser) return { error: "กรุณาเข้าสู่ระบบ" };

  const displayName = (formData.get("display_name") as string)?.trim() || null;
  const bio         = (formData.get("bio") as string)?.trim() || null;
  const avatar      = (formData.get("avatar") as string) || null;

  if (displayName !== null && displayName.length < 2)
    return { error: "นามแฝงต้องมีอย่างน้อย 2 ตัวอักษร" };
  if (bio !== null && bio.length > 200)
    return { error: "คำอธิบายต้องไม่เกิน 200 ตัวอักษร" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, bio, avatar: avatar || null })
    .eq("id", currentUser.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function completeOnboarding(
  _: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true } | undefined> {
  const currentUser = await getSession();
  if (!currentUser) return { error: "กรุณาเข้าสู่ระบบ" };

  const displayName = (formData.get("display_name") as string)?.trim() || null;
  const bio         = (formData.get("bio") as string)?.trim() || null;
  const avatar      = (formData.get("avatar") as string) || null;

  if (!displayName || displayName.length < 2)
    return { error: "กรุณากรอกนามแฝงอย่างน้อย 2 ตัวอักษร" };
  if (!avatar)
    return { error: "กรุณาเลือก Avatar" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, bio, avatar, onboarding_complete: true })
    .eq("id", currentUser.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updatePrivateInfo(
  _: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true } | undefined> {
  const currentUser = await getSession();
  if (!currentUser) return { error: "กรุณาเข้าสู่ระบบ" };

  const tel      = (formData.get("tel") as string)?.trim() || null;
  const dob      = (formData.get("dob") as string)?.trim() || null;
  const country  = (formData.get("country") as string)?.trim() || null;
  const language = (formData.get("language") as string)?.trim() || null;

  const twitter   = (formData.get("social_twitter") as string)?.trim() || "";
  const instagram = (formData.get("social_instagram") as string)?.trim() || "";
  const youtube   = (formData.get("social_youtube") as string)?.trim() || "";
  const website   = (formData.get("social_website") as string)?.trim() || "";
  const social_links = (twitter || instagram || youtube || website)
    ? { twitter, instagram, youtube, website }
    : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ tel, dob: dob || null, country, language, social_links })
    .eq("id", currentUser.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

// kept for backwards compat
export const updateProfile = updatePublicProfile;

// ─── Admin actions ────────────────────────────────────────────────────────────

async function getAdminSession() {
  const user = await getSession();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function banUser(
  targetId: string,
  reason: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await getAdminSession();
  if (!admin) return { error: "ไม่มีสิทธิ์" };
  if (targetId === admin.id) return { error: "ไม่สามารถแบนตัวเองได้" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "banned", banned_at: new Date().toISOString(), banned_reason: reason.trim() || null, banned_by: admin.id })
    .eq("id", targetId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: admin.id, target_id: targetId, action: "ban", detail: { reason },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function unbanUser(
  targetId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await getAdminSession();
  if (!admin) return { error: "ไม่มีสิทธิ์" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "active", banned_at: null, banned_reason: null, banned_by: null })
    .eq("id", targetId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: admin.id, target_id: targetId, action: "unban", detail: {},
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteUser(
  targetId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await getAdminSession();
  if (!admin) return { error: "ไม่มีสิทธิ์" };
  if (targetId === admin.id) return { error: "คุณเป็น Admin อยู่แล้ว" };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ role: "admin" }).eq("id", targetId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: admin.id, target_id: targetId, action: "promote", detail: { role: "admin" },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function demoteUser(
  targetId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await getAdminSession();
  if (!admin) return { error: "ไม่มีสิทธิ์" };
  if (targetId === admin.id) return { error: "ไม่สามารถลด rank ตัวเองได้" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if ((count ?? 0) <= 1) return { error: "ต้องมี Admin อย่างน้อย 1 คนในระบบ" };

  const { error } = await supabase.from("users").update({ role: "user" }).eq("id", targetId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: admin.id, target_id: targetId, action: "demote", detail: { role: "user" },
  });
  revalidatePath("/admin/users");
  return { success: true };
}
