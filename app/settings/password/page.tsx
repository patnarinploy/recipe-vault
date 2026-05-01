"use client";

import { changePassword } from "@/app/actions/auth";
import { useActionState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";

export default function PasswordPage() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  const inputCls =
    "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";

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
            <p className="text-xs text-stone-400 mt-0.5">ต้องยืนยันรหัสผ่านเดิมก่อนทุกครั้ง</p>
          </div>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
            <input name="current_password" type="password" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>รหัสผ่านใหม่</label>
            <input name="new_password" type="password" required minLength={4} className={inputCls} />
            <p className="text-xs text-stone-400 mt-1.5">อย่างน้อย 4 ตัวอักษร</p>
          </div>
          <div>
            <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
            <input name="confirm_password" type="password" required minLength={4} className={inputCls} />
          </div>

          {state && "error" in state && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{state.error}</p>
          )}
          {state && "success" in state && (
            <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
              เปลี่ยนรหัสผ่านสำเร็จ
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm mt-2"
          >
            {pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
