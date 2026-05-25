import { requireAdmin } from "@/lib/session";
import AdminLayout from "@/components/admin/AdminLayout";
import { getServerLocale } from "@/lib/locale/server";
import UIShowcaseClient from "./UIShowcaseClient";

export const revalidate = 0;

export default async function UIShowcasePage() {
  await requireAdmin();
  const { t } = await getServerLocale();
  return (
    <AdminLayout title={t.admin.uiShowcase.label} backLabel={t.admin.back} maxWidth="xl">
      <p className="text-sm text-secondary -mt-4 mb-8">{t.admin.uiShowcase.sub}</p>
      <UIShowcaseClient />
    </AdminLayout>
  );
}
