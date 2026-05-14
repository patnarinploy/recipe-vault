"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function PasswordPage() {
  const [sending, setSending] = useState(false);

  async function handleReset() {
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("ไม่พบอีเมลในบัญชีของคุณ");
      setSending(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/password/update`,
    });
    if (error) toast.error(error.message);
    else toast.success("ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว — กรุณาตรวจสอบกล่องจดหมาย");
    setSending(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ตั้งค่า
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">รหัสผ่าน</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <KeyRound className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">เปลี่ยนรหัสผ่าน</p>
            <p className="text-xs text-stone-400 mt-0.5">ระบบจะส่งลิงก์รีเซ็ตไปยังอีเมลของคุณ</p>
          </div>
        </div>

        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          กดปุ่มด้านล่างเพื่อรับอีเมลพร้อมลิงก์สำหรับตั้งรหัสผ่านใหม่
          ลิงก์มีอายุ 1 ชั่วโมง
        </p>

        <button
          type="button"
          onClick={handleReset}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          <Mail className="w-4 h-4" />
          {sending ? "กำลังส่ง…" : "ส่งอีเมลรีเซ็ตรหัสผ่าน"}
        </button>
      </div>
    </div>
  );
}
