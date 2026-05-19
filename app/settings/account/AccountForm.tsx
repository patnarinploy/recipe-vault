"use client";

import { useActionState, useEffect } from "react";
import { updatePrivateInfo } from "@/app/actions/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/ui/LoadingButton";

const COUNTRY_LIST = [
  "Thailand", "Japan", "South Korea", "United States", "United Kingdom",
  "Australia", "Singapore", "Germany", "France", "Canada", "Other",
];
const LANGUAGE_LIST = ["ไทย", "English", "日本語", "한국어", "Français", "Deutsch", "Other"];

export default function AccountForm({
  currentEmail,
  currentTel,
  currentDob,
  currentCountry,
  currentLanguage,
  currentSocialLinks,
}: {
  currentEmail: string | null;
  currentTel: string | null;
  currentDob: string | null;
  currentCountry: string | null;
  currentLanguage: string | null;
  currentSocialLinks: Record<string, string> | null;
}) {
  const [state, action, pending] = useActionState(updatePrivateInfo, undefined);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ");
    else if ("error" in state) toast.error(state.error);
  }, [state]);

  const inputCls = "w-full border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-surface text-foreground placeholder:text-muted";
  const labelCls = "block text-sm font-semibold text-secondary mb-1";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ตั้งค่า
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">ข้อมูลส่วนตัว</h1>
      <p className="text-sm text-muted mb-6">ข้อมูลนี้เป็นส่วนตัว ไม่แสดงต่อสาธารณะ</p>

      <form action={action} className="space-y-5">

        {/* Email — read-only, managed by Supabase Auth */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <label className={labelCls}>อีเมล</label>
          <p className="text-xs text-muted mb-2">จัดการผ่านการเข้าสู่ระบบ ไม่สามารถแก้ไขได้ที่นี่</p>
          <input
            type="email"
            value={currentEmail ?? ""}
            disabled
            className="w-full border border-outline rounded-xl px-4 py-2.5 text-sm bg-elevated text-muted cursor-not-allowed"
          />
        </div>

        {/* Contact */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">ติดต่อ</p>
          <div>
            <label className={labelCls}>เบอร์โทรศัพท์</label>
            <input name="tel" type="tel" defaultValue={currentTel ?? ""} placeholder="08x-xxx-xxxx" className={inputCls} />
          </div>
        </div>

        {/* Personal */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">ข้อมูลส่วนบุคคล</p>
          <div>
            <label className={labelCls}>วันเกิด</label>
            <input name="dob" type="date" defaultValue={currentDob ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ประเทศ</label>
            <select name="country" defaultValue={currentCountry ?? ""} className={inputCls}>
              <option value="">— ไม่ระบุ —</option>
              {COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>ภาษาหลัก</label>
            <select name="language" defaultValue={currentLanguage ?? ""} className={inputCls}>
              <option value="">— ไม่ระบุ —</option>
              {LANGUAGE_LIST.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Social links */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">ลิงก์โซเชียล</p>
          {[
            { name: "social_twitter",   label: "X / Twitter",  placeholder: "https://x.com/username" },
            { name: "social_instagram", label: "Instagram",    placeholder: "https://instagram.com/username" },
            { name: "social_youtube",   label: "YouTube",      placeholder: "https://youtube.com/@channel" },
            { name: "social_website",   label: "เว็บไซต์",    placeholder: "https://yoursite.com" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className={labelCls}>{label}</label>
              <input
                name={name}
                type="url"
                defaultValue={currentSocialLinks?.[name.replace("social_", "")] ?? ""}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <LoadingButton type="submit" pending={pending} pendingLabel="กำลังบันทึก…" className="w-full py-3 text-sm font-semibold">
          บันทึกข้อมูลส่วนตัว
        </LoadingButton>
      </form>
    </div>
  );
}
