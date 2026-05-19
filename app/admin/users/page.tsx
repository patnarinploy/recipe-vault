import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminUsersClient from "./AdminUsersClient";
import { getServerLocale } from "@/lib/locale/server";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { t } = await getServerLocale();

  const { data: users } = await supabase
    .from("users")
    .select("id, auth_id, display_name, bio, avatar, email, role, status, banned_at, banned_reason, banned_by, onboarding_complete, last_seen, created_at")
    .order("created_at")
    .returns<User[]>();

  return (
    <AdminLayout title={t.admin.users.title} backLabel={t.admin.back}>
      <AdminUsersClient users={users ?? []} currentAdminId={admin.id} />
    </AdminLayout>
  );
}
