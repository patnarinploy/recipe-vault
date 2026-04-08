"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

const BUCKET = "recipe-images";
const MAX_MB = 5;

export default function ImageUpload({ value, onChange }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`ไฟล์ต้องไม่เกิน ${MAX_MB} MB`);
      return;
    }

    // local preview while uploading
    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (upErr) {
      toast.error("อัปโหลดรูปไม่สำเร็จ: " + upErr.message);
      setPreview(value);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
    toast.success("อัปโหลดรูปสำเร็จ");
  }

  async function remove() {
    if (value) {
      const path = value.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-2">
        รูปภาพ
      </label>

      {preview ? (
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-stone-200 group">
          <Image src={preview} alt="recipe preview" fill className="object-cover" />
          {!uploading && (
            <button
              type="button"
              onClick={remove}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium animate-pulse">
                กำลังอัปโหลด…
              </span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-stone-200 hover:border-orange-400 rounded-xl py-12 flex flex-col items-center gap-2 text-stone-400 hover:text-orange-400 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-sm animate-pulse">กำลังอัปโหลด…</span>
          ) : (
            <>
              <div className="bg-stone-100 rounded-full p-3">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">คลิกเพื่ออัปโหลดรูปภาพ</span>
              <span className="text-xs">PNG, JPG, WEBP ไม่เกิน {MAX_MB} MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
