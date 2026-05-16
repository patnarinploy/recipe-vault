import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, Sparkles, ScrollText, Settings2, ChevronRight } from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  const sections = [
    {
      href:        "/admin/users",
      icon:        Users,
      title:       "จัดการผู้ใช้",
      description: "ดูรายชื่อผู้ใช้ทั้งหมด จัดการ Role และสถานะบัญชี",
      meta:        userCount !== null ? `${userCount} บัญชี` : null,
      enabled:     true,
    },
    {
      href:        "/admin/achievements",
      icon:        Trophy,
      title:       "จัดการ Achievement",
      description: "ดูฉายา Badge และเงื่อนไขของระบบ Achievement ทั้งหมด",
      meta:        null,
      enabled:     true,
    },
    {
      href:        "/admin/updates",
      icon:        Sparkles,
      title:       "อัปเดตระบบ",
      description: "ประวัติการพัฒนา ฟีเจอร์ใหม่ การปรับปรุง และ Bug Fix",
      meta:        null,
      enabled:     true,
    },
    {
      href:        "#",
      icon:        ScrollText,
      title:       "Audit Logs",
      description: "ติดตามการเปลี่ยนแปลงสำคัญในระบบ",
      meta:        "เร็วๆ นี้",
      enabled:     false,
    },
    {
      href:        "#",
      icon:        Settings2,
      title:       "ตั้งค่าระบบ",
      description: "ปรับแต่งการทำงานของแพลตฟอร์ม",
      meta:        "เร็วๆ นี้",
      enabled:     false,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Admin Console</p>
          <h1 className="text-2xl font-bold text-stone-800">การจัดการระบบ</h1>
        </div>
        <p className="text-xs text-stone-400 pb-0.5">
          {admin.display_name ?? admin.email ?? "Admin"}
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(({ href, icon: Icon, title, description, meta, enabled }) =>
          enabled ? (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 hover:border-orange-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{title}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">{description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {meta && (
                  <span className="text-xs text-stone-400 font-medium">{meta}</span>
                )}
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors" />
              </div>
            </Link>
          ) : (
            <div
              key={title}
              className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 px-5 py-4 opacity-50 cursor-not-allowed select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-500">{title}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">{description}</p>
              </div>
              <span className="text-xs text-stone-400 font-medium shrink-0 px-2.5 py-1 rounded-full bg-stone-100">
                {meta}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
