"use client";

import { useActionState, useEffect } from "react";
import { updatePrivateInfo } from "@/app/actions/auth";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/ui/LoadingButton";

export default function AccountForm({
  currentUsername,
  currentRole,
  currentEmail,
  currentTel,
}: {
  currentUsername: string;
  currentRole: "admin" | "user";
  currentEmail: string | null;
  currentTel: string | null;
}) {
  const [state, action, pending] = useActionState(updatePrivateInfo, undefined);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ");
    else if ("error" in state) toast.error(state.error);
  }, [state]);

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ตั้งค่า
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-1">ข้อมูลส่วนตัว</h1>
      <p className="text-sm text-stone-400 mb-6">ข้อมูลนี้เป็นส่วนตัว ไม่แสดงต่อสาธารณะ</p>

      <form action={action} className="space-y-5">

        {/* Username (read-only) */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-semibold text-stone-700">ชื่อผู้ใช้ (Username)</p>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Lock className="w-3 h-3" />
              ใช้สำหรับ Login
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-3">ไม่สามารถเปลี่ยนได้ที่นี่</p>
          <input
            type="text"
            value={currentUsername}
            disabled
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-stone-50 text-stone-400 cursor-not-allowed"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-700 mb-1">Role</p>
          <p className="text-xs text-stone-400 mb-3">ระดับสิทธิ์ในระบบ</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              currentRole === "admin"
                ? "bg-orange-100 text-orange-600"
                : "bg-stone-100 text-stone-600"
            }`}>
              {currentRole === "admin" ? "👑 Admin" : "👤 User"}
            </span>
            <span className="text-xs text-stone-400">ไม่สามารถเปลี่ยนได้</span>
          </div>
        </div>

        {/* Email + Tel */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">อีเมล</label>
            <input
              name="email"
              type="email"
              defaultValue={currentEmail ?? ""}
              placeholder="example@email.com"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              name="tel"
              type="tel"
              defaultValue={currentTel ?? ""}
              placeholder="08x-xxx-xxxx"
              className={inputCls}
            />
          </div>
        </div>

        <LoadingButton
          type="submit"
          pending={pending}
          pendingLabel="กำลังบันทึก…"
          className="w-full py-3 text-sm font-semibold"
        >
          บันทึกข้อมูลส่วนตัว
        </LoadingButton>
      </form>
    </div>
  );
}
