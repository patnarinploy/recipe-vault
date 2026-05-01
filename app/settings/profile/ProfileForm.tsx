"use client";

import { useActionState, useRef, useState } from "react";
import { updatePublicProfile } from "@/app/actions/auth";
import { AVATAR_ANIMALS, emojiAvatarBg, isAvatarUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const BUCKET = "recipe-images";
const MAX_MB = 5;

export default function ProfileForm({
  currentUsername,
  currentDisplayName,
  currentBio,
  currentAvatar,
}: {
  currentUsername: string;
  currentDisplayName: string | null;
  currentBio: string | null;
  currentAvatar: string | null;
}) {
  const [state, action, pending] = useActionState(updatePublicProfile, undefined);
  const [selected, setSelected] = useState<string>(currentAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`ไฟล์ต้องไม่เกิน ${MAX_MB} MB`);
      return;
    }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const sb   = createClient();
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) {
      toast.error("อัปโหลดไม่สำเร็จ: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    setSelected(data.publicUrl);
    setUploading(false);
  }

  const isUrl    = isAvatarUrl(selected);
  const isEmoji  = !!selected && !isUrl;
  const previewBg = isEmoji ? emojiAvatarBg(selected) : "#fed7aa";

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

      <h1 className="text-2xl font-bold text-stone-800 mb-1">โปรไฟล์นักเขียน</h1>
      <p className="text-sm text-stone-400 mb-6">ข้อมูลที่คนอื่นจะเห็นเมื่อดูหนังสือของคุณ</p>

      <form action={action} className="space-y-5">

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-stone-700 mb-0.5">Avatar</p>
          <p className="text-xs text-stone-400 mb-5">เลือกสัตว์น่ารักหรืออัปโหลดรูปของคุณเอง</p>

          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden"
              style={{ background: isUrl ? "#f5f5f4" : previewBg }}
            >
              {isUrl ? (
                <img src={selected} alt="avatar" className="w-full h-full object-cover" />
              ) : isEmoji ? (
                <span className="text-5xl leading-none">{selected}</span>
              ) : (
                <span className="text-3xl font-bold text-white" style={{ background: "#f97316", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(currentDisplayName ?? currentUsername)[0].toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`relative aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                isUrl
                  ? "border-orange-500 shadow-md scale-105 overflow-hidden"
                  : "border-dashed border-stone-300 hover:border-orange-400 bg-stone-50 hover:bg-orange-50"
              }`}
              title="อัปโหลดรูปของคุณ"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
              ) : isUrl ? (
                <>
                  <img src={selected} alt="uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-orange-500 bg-white rounded-full" />
                </>
              ) : (
                <Camera className="w-4 h-4 text-stone-400" />
              )}
            </button>

            {AVATAR_ANIMALS.map(({ value, name, bg }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={`relative aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                  selected === value
                    ? "border-orange-500 shadow-md scale-105"
                    : "border-transparent hover:border-stone-200"
                }`}
                style={{ background: bg }}
                title={name}
              >
                {value}
                {selected === value && (
                  <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-orange-500 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          <input type="hidden" name="avatar" value={selected} />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Public info fields */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">นามแฝง</label>
            <p className="text-xs text-stone-400 mb-2">ชื่อที่แสดงบนปกหนังสือและในเว็บ</p>
            <input
              name="display_name"
              type="text"
              defaultValue={currentDisplayName ?? ""}
              minLength={2}
              maxLength={50}
              placeholder="เช่น Chef แมวเหมียว, สูตรลับคุณแพนกวิ้น"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">คำอธิบายตัวตน</label>
            <p className="text-xs text-stone-400 mb-2">แนะนำตัวเองสั้นๆ ให้คนอื่นรู้จักคุณ</p>
            <textarea
              name="bio"
              defaultValue={currentBio ?? ""}
              maxLength={200}
              rows={3}
              placeholder="เช่น สายกินสายทำอาหาร ชอบทดลองสูตรใหม่ๆ..."
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-stone-400 mt-1">ไม่เกิน 200 ตัวอักษร</p>
          </div>
        </div>

        {state && "error" in state && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{state.error}</p>
        )}
        {state && "success" in state && (
          <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">บันทึกโปรไฟล์สำเร็จ</p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {pending ? "กำลังบันทึก…" : "บันทึกโปรไฟล์นักเขียน"}
        </button>
      </form>
    </div>
  );
}
