import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPresetUnitsClient from "./AdminPresetUnitsClient";
import type { PresetUnit } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPresetUnitsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: units } = await supabase
    .from("preset_units")
    .select("*")
    .returns<PresetUnit[]>();

  return (
    <AdminLayout title="จัดการหน่วยวัด" backLabel="System Management">
      <AdminPresetUnitsClient units={units ?? []} />
    </AdminLayout>
  );
}
