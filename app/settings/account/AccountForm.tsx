"use client";

import { useActionState, useEffect } from "react";
import { updatePrivateInfo } from "@/app/actions/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/ui/LoadingButton";
import { useLocale } from "@/lib/locale";
import { SelectCustom } from "@/components/ui/select-custom";

function getSocialDefault(stored: string | undefined | null, _platform: string): string {
  if (!stored) return "";
  return stored.replace(/^https?:\/\//, "");
}

const COUNTRY_LIST = [
  "Thailand", "Japan", "South Korea", "United States", "United Kingdom",
  "Australia", "Singapore", "Germany", "France", "Canada", "Other",
];
const LANGUAGE_LIST = ["ไทย", "English", "日本語", "한국어", "Français", "Deutsch", "Other"];

export default function AccountForm({
  currentEmail,
  currentTel,
  currentDob,
  currentCountry,
  currentLanguage,
  currentSocialLinks,
}: {
  currentEmail: string | null;
  currentTel: string | null;
  currentDob: string | null;
  currentCountry: string | null;
  currentLanguage: string | null;
  currentSocialLinks: Record<string, string> | null;
}) {
  const { t } = useLocale();
  const a = t.settings.account;

  const [state, action, pending] = useActionState(updatePrivateInfo, undefined);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) toast.success(a.saveSuccess);
    else if ("error" in state) toast.error(state.error);
  }, [state, a.saveSuccess]);

  const inputCls  = "w-full border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none bg-surface text-foreground placeholder:text-muted";
  const labelCls = "block text-sm font-semibold text-secondary mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.settings.title}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">{a.label}</h1>
      <p className="text-sm text-muted mb-6">{a.subtitle}</p>

      <form action={action} className="space-y-5">

        {/* Email — read-only, managed by Supabase Auth */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <label className={labelCls}>{a.emailLabel}</label>
          <p className="text-xs text-muted mb-2">{a.emailDesc}</p>
          <input
            type="email"
            value={currentEmail ?? ""}
            disabled
            className="w-full border border-outline rounded-xl px-4 py-2.5 text-sm bg-elevated text-muted cursor-not-allowed"
          />
        </div>

        {/* Contact */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">{a.contactHeader}</p>
          <div>
            <label className={labelCls}>{a.phoneLabel}</label>
            <input name="tel" type="tel" defaultValue={currentTel ?? ""} placeholder="08x-xxx-xxxx" className={inputCls} />
          </div>
        </div>

        {/* Personal */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">{a.personalHeader}</p>
          <div>
            <label className={labelCls}>{a.dobLabel}</label>
            <input name="dob" type="date" defaultValue={currentDob ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{a.countryLabel}</label>
            <SelectCustom
              name="country"
              defaultValue={currentCountry ?? ""}
              options={[...COUNTRY_LIST]}
              placeholder={a.unspecified}
              clearable
            />
          </div>
          <div>
            <label className={labelCls}>{a.languageLabel}</label>
            <SelectCustom
              name="language"
              defaultValue={currentLanguage ?? ""}
              options={[...LANGUAGE_LIST]}
              placeholder={a.unspecified}
              clearable
            />
          </div>
        </div>

        {/* Social links */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-secondary">{a.socialHeader}</p>
          {[
            { name: "social_twitter",   label: "X / Twitter",    dbKey: "twitter" },
            { name: "social_instagram", label: "Instagram",       dbKey: "instagram" },
            { name: "social_youtube",   label: "YouTube",         dbKey: "youtube" },
            { name: "social_website",   label: a.websiteLabel,    dbKey: "website" },
          ].map(({ name, label, dbKey }) => (
            <div key={name}>
              <label className={labelCls}>{label}</label>
              <div className="flex items-center border border-outline rounded-xl bg-surface overflow-hidden focus-within:ring-1 focus-within:ring-orange-400 transition-colors">
                <span className="flex shrink-0 items-center self-stretch px-3 text-sm text-muted bg-elevated border-r border-border select-none whitespace-nowrap">
                  https://
                </span>
                <input
                  name={name}
                  type="text"
                  defaultValue={getSocialDefault(currentSocialLinks?.[dbKey], dbKey)}
                  placeholder="www.example.com"
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent text-foreground focus:outline-none focus:ring-0 focus:[box-shadow:none] placeholder:text-muted"
                />
              </div>
            </div>
          ))}
        </div>

        <LoadingButton type="submit" pending={pending} pendingLabel={t.common.saving} className="w-full py-3 text-sm font-semibold">
          {a.saveBtn}
        </LoadingButton>
      </form>
    </div>
  );
}
