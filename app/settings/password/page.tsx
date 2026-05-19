import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getServerLocale } from "@/lib/locale/server";

export default async function PasswordPage() {
  const user = await requireSession();
  const { t } = await getServerLocale();
  const s = t.settings;
  const sec = t.admin.security;

  const provider = user.auth_provider
    ? { google: "Google", azure: "Microsoft", email: "Email" }[user.auth_provider] ?? user.auth_provider
    : "OAuth";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {s.title}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">{s.security.label}</h1>

      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{sec.managedBy} {provider}</p>
            <p className="text-xs text-muted mt-0.5">{sec.security} {provider}</p>
          </div>
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          {sec.manage}
        </p>
      </div>
    </div>
  );
}
