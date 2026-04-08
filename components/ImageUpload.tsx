"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import toast from "react-hot-toast";

type Props = {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
};

export default function ImageUpload({ userId, value, onChange }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 5MB");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("อัปโหลดรูปสำเร็จ");
  }

  async function removeImage() {
    if (!value) return;
    const path = value.split("/recipe-images/")[1];
    if (path) {
      await supabase.storage.from("recipe-images").remove([path]);
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ</label>

      {value ? (
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-gray-200 group">
          <Image src={value} alt="recipe" fill className="object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 text-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <span>กำลังอัปโหลด…</span>
          ) : (
            <>
              <div className="text-3xl mb-1">📷</div>
              <div className="text-sm">คลิกเพื่ออัปโหลดรูปภาพ</div>
              <div className="text-xs mt-1">PNG, JPG, WEBP ไม่เกิน 5MB</div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
