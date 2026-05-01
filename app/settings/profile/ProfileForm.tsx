"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/actions/auth";
import { AVATAR_OPTIONS, avatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ProfileForm({
  currentUsername,
  currentAvatar,
}: {
  currentUsername: string;
  currentAvatar: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [selected, setSelected] = useState<string>(currentAvatar ?? "");

  const inputCls =
    "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ตั้งค่า
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">ข้อมูลส่วนตัว</h1>

      <form action={action} className="space-y-6">
        {/* Avatar preview */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-stone-700 mb-1">Avatar</p>
          <p className="text-xs text-stone-400 mb-5">เลือกตัวละครสัตว์ที่เป็นตัวแทนของคุณ</p>

          {/* Current preview */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {selected ? (
                <img
                  src={avatarUrl(selected, 100)}
                  alt="avatar"
                  className="w-24 h-24 rounded-full bg-amber-50 border-4 border-orange-200 shadow"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-500 border-4 border-orange-200 shadow flex items-center justify-center">
                  <span className="text-3xl font-bold text-white select-none">
                    {currentUsername[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-6 gap-2.5">
            {/* "ไม่มี" option */}
            <button
              type="button"
              onClick={() => setSelected("")}
              className={`relative aspect-square rounded-xl border-2 flex items-center justify-center text-lg transition-all ${
                selected === ""
                  ? "border-orange-500 bg-orange-50 shadow-md scale-105"
                  : "border-stone-200 hover:border-stone-300 bg-stone-50"
              }`}
              title="ตัวอักษร (ค่าเริ่มต้น)"
            >
              <span className="text-base font-bold text-stone-500">
                {currentUsername[0].toUpperCase()}
              </span>
              {selected === "" && (
                <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-orange-500 bg-white rounded-full" />
              )}
            </button>

            {AVATAR_OPTIONS.map(({ seed, name }) => (
              <button
                key={seed}
                type="button"
                onClick={() => setSelected(seed)}
                className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                  selected === seed
                    ? "border-orange-500 shadow-md scale-105"
                    : "border-stone-200 hover:border-stone-300"
                }`}
                title={name}
              >
                <img
                  src={avatarUrl(seed, 80)}
                  alt={name}
                  className="w-full h-full object-cover bg-amber-50"
                />
                {selected === seed && (
                  <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-orange-500 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          <input type="hidden" name="avatar" value={selected} />
        </div>

        {/* นามแฝง */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-stone-700 mb-1">นามแฝง</p>
          <p className="text-xs text-stone-400 mb-4">
            ชื่อที่แสดงในเว็บและบนปกหนังสือสูตรของคุณ
          </p>
          <input
            name="username"
            type="text"
            defaultValue={currentUsername}
            required
            minLength={3}
            placeholder="a-z, A-Z, 0-9, _"
            className={inputCls}
          />
          <p className="text-xs text-stone-400 mt-2">
            อย่างน้อย 3 ตัวอักษร · ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น
          </p>
        </div>

        {/* Feedback */}
        {state && "error" in state && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{state.error}</p>
        )}
        {state && "success" in state && (
          <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
            บันทึกข้อมูลส่วนตัวสำเร็จ
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {pending ? "กำลังบันทึก…" : "บันทึกข้อมูลส่วนตัว"}
        </button>
      </form>
    </div>
  );
}
