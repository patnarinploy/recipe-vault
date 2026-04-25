"use client";

import { changePassword } from "@/app/actions/auth";
import { useActionState, useEffect, useState } from "react";
import { KeyRound, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const [flipType, setFlipType] = useState<"soft" | "hard">("soft");

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  function handleFlipType(type: "soft" | "hard") {
    setFlipType(type);
    localStorage.setItem("rv_page_flip_type", type);
  }

  const inputCls =
    "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      {/* ── Reading preferences ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h1 className="text-lg font-bold text-stone-800 mb-5 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-500" />
          การตั้งค่าการอ่าน
        </h1>

        <div>
          <label className={labelCls}>รูปแบบการพลิกหน้า</label>
          <p className="text-xs text-stone-400 mb-3">
            เลือกลักษณะการพลิกหน้าหนังสือเมื่อเปิดอ่านสูตร
          </p>
          <div className="flex rounded-xl overflow-hidden border border-stone-200">
            <button
              type="button"
              onClick={() => handleFlipType("soft")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                flipType === "soft"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              ซอฟต์ (พลิ้วโค้ง)
            </button>
            <div className="w-px bg-stone-200" />
            <button
              type="button"
              onClick={() => handleFlipType("hard")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                flipType === "hard"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              แข็ง (กระดาษหนา)
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {flipType === "soft"
              ? "หน้ากระดาษจะโค้งงอเหมือนหนังสือทั่วไป"
              : "หน้ากระดาษจะพลิกแบบแข็งเหมือนหนังสือปกแข็ง"}
          </p>
        </div>
      </div>

      {/* ── Password change ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-orange-500" />
          เปลี่ยนรหัสผ่าน
        </h2>

        <form action={action} className="space-y-4">
          <div>
            <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
            <input
              name="current_password"
              type="password"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>รหัสผ่านใหม่</label>
            <input
              name="new_password"
              type="password"
              required
              minLength={4}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={4}
              className={inputCls}
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
