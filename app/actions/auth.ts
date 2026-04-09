"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  verifyPassword,
  hashPassword,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function login(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "กรุณากรอก username และ password" };
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("username", username)
    .single();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "username หรือ password ไม่ถูกต้อง" };
  }

  const token = createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createUser(formData: FormData) {
  const currentUser = await getSession();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "ไม่มีสิทธิ์" };
  }

  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "user";

  if (!username || !password) {
    return { error: "กรุณากรอก username และ password" };
  }
  if (username.length < 3) {
    return { error: "username ต้องมีอย่างน้อย 3 ตัวอักษร" };
  }
  if (password.length < 4) {
    return { error: "password ต้องมีอย่างน้อย 4 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").insert({
    username,
    password_hash: hashPassword(password),
    role,
  });

  if (error) {
    if (error.code === "23505") return { error: "username นี้มีอยู่แล้ว" };
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteUser(userId: string) {
  const currentUser = await getSession();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "ไม่มีสิทธิ์" };
  }
  if (userId === currentUser.id) {
    return { error: "ไม่สามารถลบตัวเองได้" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function changePassword(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | { success: true } | undefined> {
  const currentUser = await getSession();
  if (!currentUser) return { error: "กรุณาเข้าสู่ระบบ" };

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านใหม่ไม่ตรงกัน" };
  }
  if (newPassword.length < 4) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", currentUser.id)
    .single();

  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const { error } = await supabase
    .from("users")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", currentUser.id);

  if (error) return { error: error.message };
  return { success: true };
}
