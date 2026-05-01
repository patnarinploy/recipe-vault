"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ReadingPage() {
  const [flipType, setFlipType] = useState<"soft" | "hard">("soft");

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  function handleFlipType(type: "soft" | "hard") {
    setFlipType(type);
    localStorage.setItem("rv_page_flip_type", type);
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

      <h1 className="text-2xl font-bold text-stone-800 mb-6">การตั้งค่าการอ่าน</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">รูปแบบการพลิกหน้า</p>
            <p className="text-xs text-stone-400 mt-0.5">เลือกลักษณะการพลิกหน้าเมื่อเปิดอ่านสูตร</p>
          </div>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-stone-200 mb-3">
          {(["soft", "hard"] as const).map((type, i) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFlipType(type)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                i === 1 ? "border-l border-stone-200" : ""
              } ${
                flipType === type
                  ? "bg-orange-500 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {type === "soft" ? "ซอฟต์ (พลิ้วโค้ง)" : "แข็ง (กระดาษหนา)"}
            </button>
          ))}
        </div>

        <p className="text-xs text-stone-400">
          {flipType === "soft"
            ? "หน้ากระดาษจะโค้งงอเหมือนหนังสือทั่วไป เหมาะกับหนังสือนิยาย"
            : "หน้ากระดาษจะพลิกแบบแข็งเหมือนหนังสือปกแข็ง เหมาะกับสมุดบันทึก"}
        </p>
      </div>
    </div>
  );
}
