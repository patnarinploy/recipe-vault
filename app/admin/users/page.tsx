import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/types";
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
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">จัดการผู้ใช้</h1>

      <AdminUsersClient users={users ?? []} currentAdminId={admin.id} />
    </div>
  );
}
