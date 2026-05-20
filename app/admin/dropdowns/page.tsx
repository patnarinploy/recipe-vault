import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDropdownsClient from "./AdminDropdownsClient";
import type { PresetCategory, PresetUnit } from "@/lib/types";
import { getServerLocale } from "@/lib/locale/server";

export const revalidate = 0;

export default async function AdminDropdownsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { t } = await getServerLocale();

  const [unitsRes, categoriesRes] = await Promise.all([
    supabase.from("preset_units").select("*").returns<PresetUnit[]>(),
    supabase.from("preset_categories").select("*").returns<PresetCategory[]>(),
  ]);

  return (
    <AdminLayout title={t.admin.dropdowns.title} backLabel={t.admin.back}>
      <AdminDropdownsClient
        units={unitsRes.data ?? []}
        categories={categoriesRes.data ?? []}
      />
    </AdminLayout>
  );
}
