"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePublicProfile } from "@/app/actions/auth";
import { AVATAR_PRESETS, isAvatarUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Camera, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/ui/LoadingButton";
import { useLocale } from "@/lib/locale";

const BUCKET = "recipe-images";
const MAX_MB = 5;

export default function ProfileForm({
  currentDisplayName,
  currentBio,
  currentAvatar,
}: {
  currentDisplayName: string | null;
  currentBio: string | null;
  currentAvatar: string | null;
}) {
  const { t } = useLocale();
  const p = t.settings.profile;

  const [state, action, pending] = useActionState(updatePublicProfile, undefined);
  const [selected, setSelected] = useState<string>(currentAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) toast.success(p.saveSuccess);
    else if ("error" in state) toast.error(state.error);
  }, [state, p.saveSuccess]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(p.fileSizeError.replace("{mb}", String(MAX_MB)));
      return;
    }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const sb   = createClient();
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) {
      toast.error(`${p.uploadError}: ${error.message}`);
      setUploading(false);
      return;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    setSelected(data.publicUrl);
    setUploading(false);
  }

  const isUrl = isAvatarUrl(selected);

  const inputCls = "w-full border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-surface text-foreground placeholder:text-muted";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.settings.title}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">{p.label}</h1>
      <p className="text-sm text-muted mb-6">{p.subtitle}</p>

      <form action={action} className="space-y-5">

        {/* Avatar */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <p className="text-sm font-semibold text-secondary mb-0.5">{p.avatarLabel}</p>
          <p className="text-xs text-muted mb-5">{p.avatarDesc}</p>

          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white dark:border-white/20 shadow-lg overflow-hidden"
              style={{ background: isUrl ? "#f5f5f4" : "#f97316" }}
            >
              {isUrl ? (
                <img src={selected} alt="avatar" draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {currentDisplayName?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {/* Upload custom image */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onMouseDown={(e) => e.preventDefault()}
              disabled={uploading}
              className="relative aspect-square rounded-full border-2 border-dashed border-outline hover:border-orange-400 bg-elevated hover:bg-orange-50 dark:hover:bg-orange-950/20 flex flex-col items-center justify-center gap-1 transition-all focus:outline-none focus-visible:outline-none select-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
              title={p.uploadTitle}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-muted animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 text-muted" />
                  <span className="text-[9px] text-muted">{p.uploadBtn}</span>
                </>
              )}
            </button>

            {/* Preset images */}
            {AVATAR_PRESETS.map(({ value, name }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                onMouseDown={(e) => e.preventDefault()}
                className={`relative aspect-square rounded-full transition-all select-none focus:outline-none focus-visible:outline-none ${
                  selected === value
                    ? "ring-[3px] ring-orange-500 ring-offset-2 scale-105"
                    : "[@media(hover:hover)]:hover:ring-2 [@media(hover:hover)]:hover:ring-stone-300 [@media(hover:hover)]:hover:ring-offset-1"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
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
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Public info fields */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1">
              {p.penNameLabel} <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-muted mb-2">{p.penNameDesc}</p>
            <input
              name="display_name"
              type="text"
              defaultValue={currentDisplayName ?? ""}
              minLength={2}
              maxLength={50}
              required
              placeholder={p.penNamePlaceholder}
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <label className="block text-sm font-semibold text-secondary">{p.bioLabel}</label>
              <span className="text-[11px] italic text-muted">{p.bioOptional}</span>
            </div>
            <p className="text-xs text-muted mb-2">{p.bioDesc}</p>
            <textarea
              name="bio"
              defaultValue={currentBio ?? ""}
              maxLength={200}
              rows={3}
              placeholder={p.bioPlaceholder}
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-muted mt-1">{p.bioMaxChars}</p>
          </div>
        </div>

        <LoadingButton
          type="submit"
          pending={pending}
          pendingLabel={t.common.saving}
          disabled={uploading}
          className="w-full py-3 text-sm font-semibold"
        >
          {p.saveBtn}
        </LoadingButton>
      </form>
    </div>
  );
}
