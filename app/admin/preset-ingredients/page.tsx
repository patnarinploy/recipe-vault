import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPresetIngredientsClient from "./AdminPresetIngredientsClient";
import type { PresetIngredient } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPresetIngredientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("preset_ingredients")
    .select("*")
    .order("sort_order")
    .returns<PresetIngredient[]>();

  return (
    <AdminLayout title="จัดการวัตถุดิบ Preset" backLabel="System Management">
      <AdminPresetIngredientsClient items={items ?? []} />
    </AdminLayout>
  );
}
