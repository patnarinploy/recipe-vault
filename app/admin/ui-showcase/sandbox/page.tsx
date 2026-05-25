import { requireAdmin } from "@/lib/session";
import AdminLayout from "@/components/admin/AdminLayout";
import SandboxClient from "./SandboxClient";

export const revalidate = 0;

export default async function SandboxPage() {
  await requireAdmin();
  return (
    <AdminLayout
      title="Sandbox / Playground"
      backLabel="UI Showcase"
      backHref="/admin/ui-showcase"
      maxWidth="xl"
    >
      <p className="text-sm text-secondary -mt-4 mb-8">
        พื้นที่ทดสอบ UI — สามารถแก้ไขได้อิสระโดยไม่กระทบกับหน้า Showcase
      </p>
      <SandboxClient />
    </AdminLayout>
  );
}
