"use client";

import { changePassword, changeUsername } from "@/app/actions/auth";
import { useActionState, useEffect, useState } from "react";
import { KeyRound, BookOpen, ArrowLeft, UserPen, User } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [pwState, pwAction, pwPending] = useActionState(changePassword, undefined);
  const [unState, unAction, unPending] = useActionState(changeUsername, undefined);
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
  const subHeadCls = "text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2";

  return (
    <div className="max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-stone-800 mb-8">ตั้งค่า</h1>

      <div className="space-y-6">

        {/* ── หมวด: จัดการข้อมูลส่วนตัว ─────────────────────────── */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">จัดการข้อมูลส่วนตัว</p>
                <p className="text-xs text-stone-400 mt-0.5">แก้ไขชื่อที่แสดงในเว็บและรหัสผ่าน</p>
              </div>
            </div>
          </div>

          {/* Sub-section: เปลี่ยนชื่อผู้ใช้ */}
          <div className="px-6 py-5">
            <p className={subHeadCls}>
              <UserPen className="w-4 h-4 text-stone-400" />
              เปลี่ยนชื่อผู้ใช้
            </p>
            <form action={unAction} className="space-y-4">
              <div>
                <label className={labelCls}>ชื่อผู้ใช้ใหม่</label>
                <input
                  name="new_username"
                  type="text"
                  required
                  minLength={3}
                  placeholder="a-z, A-Z, 0-9, _"
                  className={inputCls}
                />
                <p className="text-xs text-stone-400 mt-1.5">
                  อย่างน้อย 3 ตัวอักษร ใช้ได้เฉพาะ a-z, A-Z, 0-9 และ _
                </p>
              </div>
              {unState && "error" in unState && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{unState.error}</p>
              )}
              {unState && "success" in unState && (
                <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">เปลี่ยนชื่อผู้ใช้สำเร็จ</p>
              )}
              <button
                type="submit"
                disabled={unPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 text-sm"
              >
                {unPending ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </form>
          </div>

          <div className="border-t border-stone-100 mx-6" />

          {/* Sub-section: เปลี่ยนรหัสผ่าน */}
          <div className="px-6 py-5">
            <p className={subHeadCls}>
              <KeyRound className="w-4 h-4 text-stone-400" />
              เปลี่ยนรหัสผ่าน
            </p>
            <form action={pwAction} className="space-y-4">
              <div>
                <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
                <input name="current_password" type="password" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>รหัสผ่านใหม่</label>
                <input name="new_password" type="password" required minLength={4} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
                <input name="confirm_password" type="password" required minLength={4} className={inputCls} />
              </div>
              {pwState && "error" in pwState && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{pwState.error}</p>
              )}
              {pwState && "success" in pwState && (
                <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">เปลี่ยนรหัสผ่านสำเร็จ</p>
              )}
              <button
                type="submit"
                disabled={pwPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 text-sm"
              >
                {pwPending ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </form>
          </div>
        </section>

        {/* ── หมวด: การตั้งค่าการอ่าน ───────────────────────────── */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">การตั้งค่าการอ่าน</p>
                <p className="text-xs text-stone-400 mt-0.5">ปรับพฤติกรรมการแสดงผลหนังสือ</p>
              </div>
            </div>
          </div>

          {/* Sub-section: รูปแบบการพลิกหน้า */}
          <div className="px-6 py-5">
            <p className={subHeadCls}>รูปแบบการพลิกหน้า</p>
            <p className="text-xs text-stone-400 mb-3">เลือกลักษณะการพลิกหน้าหนังสือเมื่อเปิดอ่านสูตร</p>
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
        </section>

      </div>
    </div>
  );
}
