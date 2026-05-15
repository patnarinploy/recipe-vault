"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { completeOnboarding } from "@/app/actions/auth";
import { AVATAR_PRESETS, isAvatarUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { Camera, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/ui/LoadingButton";
import { useRouter } from "next/navigation";

const BUCKET = "recipe-images";

export default function OnboardingForm({
  currentDisplayName,
  currentBio,
  currentAvatar,
  currentEmail,
}: {
  currentDisplayName: string | null;
  currentBio: string | null;
  currentAvatar: string | null;
  currentEmail: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [selected, setSelected] = useState<string>(currentAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) {
      toast.success("ตั้งค่าโปรไฟล์สำเร็จ! ยินดีต้อนรับ");
      router.push("/");
      router.refresh();
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ต้องไม่เกิน 5 MB"); return; }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const sb   = createClient();
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) { toast.error("อัปโหลดไม่สำเร็จ"); setUploading(false); return; }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    setSelected(data.publicUrl);
    setUploading(false);
  }

  const isUrl = isAvatarUrl(selected);
  const emailInitial = currentEmail?.[0]?.toUpperCase() ?? "?";
  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white";

  return (
    <form action={action} className="space-y-5">
      {/* Avatar picker */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-stone-700 mb-0.5">
          Avatar <span className="text-red-400">*</span>
        </p>
        <p className="text-xs text-stone-400 mb-5">เลือกสัตว์น่ารักหรืออัปโหลดรูปของคุณเอง</p>

        <div className="flex justify-center mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg overflow-hidden transition-all ${
              selected ? "border-orange-400" : "border-stone-200 border-dashed"
            }`}
            style={{ background: isUrl ? "#f5f5f4" : selected ? "#f97316" : "#f5f5f4" }}
          >
            {isUrl ? (
              <img src={selected} alt="avatar" draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
            ) : selected ? (
              <span className="text-3xl font-bold text-white">{emailInitial}</span>
            ) : (
              <span className="text-3xl text-stone-300">?</span>
            )}
          </div>
        </div>

        {!selected && (
          <p className="text-center text-xs text-red-400 mb-3">กรุณาเลือก Avatar เพื่อดำเนินการต่อ</p>
        )}

        <div className="grid grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onMouseDown={(e) => e.preventDefault()}
            disabled={uploading}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className="relative aspect-square rounded-full border-2 border-dashed border-stone-300 hover:border-orange-400 bg-stone-50 hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition-all select-none focus:outline-none focus-visible:outline-none"
            title="อัปโหลดรูปของคุณ"
          >
            {uploading ? <Loader2 className="w-4 h-4 text-stone-400 animate-spin" /> : <>
              <Camera className="w-4 h-4 text-stone-400" />
              <span className="text-[9px] text-stone-400">อัปโหลด</span>
            </>}
          </button>
          {AVATAR_PRESETS.map(({ value, name }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              onMouseDown={(e) => e.preventDefault()}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={`relative aspect-square rounded-full transition-all select-none focus:outline-none focus-visible:outline-none ${
                selected === value
                  ? "ring-[3px] ring-orange-500 ring-offset-2 scale-105"
                  : "[@media(hover:hover)]:hover:ring-2 [@media(hover:hover)]:hover:ring-stone-300 [@media(hover:hover)]:hover:ring-offset-1"
              }`}
              title={name}
            >
              <div className="w-full h-full rounded-full overflow-hidden">
                <img src={value} alt={name} draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
              </div>
              {selected === value && (
                <div className="absolute -top-1 -right-1 z-20 w-[18px] h-[18px] bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                </div>
              )}
            </button>
          ))}
        </div>
        <input type="hidden" name="avatar" value={selected} />
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
      </div>

      {/* Name + Bio */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">
            นามแฝง <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-stone-400 mb-2">ชื่อที่แสดงบนปกหนังสือและในเว็บ</p>
          <input name="display_name" type="text" defaultValue={currentDisplayName ?? ""}
            minLength={2} maxLength={50} required
            placeholder="เช่น Chef แมวเหมียว, สูตรลับคุณแพนกวิ้น" className={inputCls} />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <label className="block text-sm font-semibold text-stone-700">คำอธิบายตัวตน</label>
            <span className="text-[11px] italic text-stone-300">(ไม่บังคับ)</span>
          </div>
          <p className="text-xs text-stone-400 mb-2">แนะนำตัวเองสั้นๆ ให้คนอื่นรู้จักคุณ</p>
          <textarea name="bio" defaultValue={currentBio ?? ""} maxLength={200} rows={3}
            placeholder="เช่น สายกินสายทำอาหาร ชอบทดลองสูตรใหม่ๆ..."
            className={`${inputCls} resize-none`} />
          <p className="text-xs text-stone-400 mt-1">ไม่เกิน 200 ตัวอักษร</p>
        </div>
      </div>

      <LoadingButton type="submit" pending={pending || uploading} pendingLabel="กำลังบันทึก…" className="w-full py-3 text-sm font-semibold">
        บันทึกโปรไฟล์นักเขียน
      </LoadingButton>
    </form>
  );
}
