import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, username, role, created_at")
    .order("created_at")
    .returns<User[]>();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">จัดการผู้ใช้</h1>
      <AdminUsersClient users={users ?? []} />
    </div>
  );
}
