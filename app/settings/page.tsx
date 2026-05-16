import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ChevronRight, User, KeyRound, BookOpen, ShieldCheck } from "lucide-react";
import WriterCard from "@/components/WriterCard";
import type { WriterInfo } from "@/lib/types";

export default async function SettingsPage() {
  const user     = await requireSession();
  const supabase = await createClient();

  // Fetch current user's own stats for the writer card preview
  const { data: myBooksData } = await supabase
    .from("books").select("id").eq("user_id", user.id);
  const bkIds = (myBooksData ?? []).map((b: { id: string }) => b.id);
  const [recipeRes, publicRes] = bkIds.length
    ? await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds),
        supabase.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds).eq("is_public", true),
      ])
    : [{ count: 0 as number | null }, { count: 0 as number | null }];
  const writerInfo: WriterInfo = {
    display_name: user.display_name,
    bio:          user.bio,
    avatar:       user.avatar,
    role:         user.role,
    book_count:   bkIds.length,
    recipe_count: recipeRes.count ?? 0,
    public_count: publicRes.count ?? 0,
    created_at:   user.created_at,
  };

  const navGroups = [
    {
      label: "โปรไฟล์",
      items: [
        { href: "/settings/profile",  icon: User,        label: "โปรไฟล์นักเขียน",    sub: "นามแฝง, Avatar และคำอธิบายตัวตน" },
        { href: "/settings/account",  icon: ShieldCheck, label: "ข้อมูลส่วนตัว",      sub: "เบอร์โทร, วันเกิด, ประเทศ, โซเชียล" },
      ],
    },
    {
      label: "บัญชี",
      items: [
        { href: "/settings/password", icon: KeyRound, label: "ความปลอดภัย",          sub: "บัญชีจัดการโดย Google / Microsoft" },
      ],
    },
    {
      label: "การใช้งาน",
      items: [
        { href: "/settings/reading",  icon: BookOpen, label: "การตั้งค่าการอ่าน",   sub: "ธีม, ภาษา, รูปแบบการพลิกหน้า" },
      ],
    },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">ตั้งค่า</h1>

      {/* Writer card preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">การ์ดนักเขียน</p>
          <Link href="/settings/profile" className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
            แก้ไข
          </Link>
        </div>
        <WriterCard info={writerInfo} />
      </div>

      {/* Nav groups */}
      <div className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest px-1 mb-2">
              {group.label}
            </p>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100 overflow-hidden">
              {group.items.map(({ href, icon: Icon, label, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3.5 px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800">{label}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
