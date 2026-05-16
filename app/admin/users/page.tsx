import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminUsersClient from "./AdminUsersClient";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, auth_id, display_name, bio, avatar, email, role, status, banned_at, banned_reason, banned_by, onboarding_complete, last_seen, created_at")
    .order("created_at")
    .returns<User[]>();

  return (
    <AdminLayout title="จัดการผู้ใช้">
      <AdminUsersClient users={users ?? []} currentAdminId={admin.id} />
    </AdminLayout>
  );
}
