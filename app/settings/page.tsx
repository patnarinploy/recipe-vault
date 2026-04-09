"use client";

import { changePassword } from "@/app/actions/auth";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h1 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-orange-500" />
          เปลี่ยนรหัสผ่าน
        </h1>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              รหัสผ่านปัจจุบัน
            </label>
            <input
              name="current_password"
              type="password"
              required
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              รหัสผ่านใหม่
            </label>
            <input
              name="new_password"
              type="password"
              required
              minLength={4}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={4}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {state && "error" in state && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}
          {state && "success" in state && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              เปลี่ยนรหัสผ่านสำเร็จ
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
          >
            {pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
