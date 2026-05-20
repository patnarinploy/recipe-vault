import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, Sparkles, ScrollText, Settings2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getServerLocale } from "@/lib/locale/server";

export const revalidate = 0;

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { t } = await getServerLocale();
  const adm = t.admin;

  const { count: userCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  const sections = [
    {
      href:        "/admin/users",
      icon:        Users,
      title:       adm.users.label,
      description: adm.users.sub,
      meta:        userCount !== null ? `${userCount} ${adm.users.accounts}` : null,
      enabled:     true,
    },
    {
      href:        "/admin/achievements",
      icon:        Trophy,
      title:       adm.achievements.label,
      description: adm.achievements.sub,
      meta:        null,
      enabled:     true,
    },
    {
      href:        "/admin/dropdowns",
      icon:        SlidersHorizontal,
      title:       adm.dropdowns.label,
      description: adm.dropdowns.sub,
      meta:        null,
      enabled:     true,
    },
    {
      href:        "/admin/updates",
      icon:        Sparkles,
      title:       adm.updates.label,
      description: adm.updates.sub,
      meta:        null,
      enabled:     true,
    },
    {
      href:        "#",
      icon:        ScrollText,
      title:       adm.audit.label,
      description: adm.audit.sub,
      meta:        t.common.comingSoon,
      enabled:     false,
    },
    {
      href:        "#",
      icon:        Settings2,
      title:       adm.system.label,
      description: adm.system.sub,
      meta:        t.common.comingSoon,
      enabled:     false,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {adm.backHome}
      </Link>

      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">{adm.console}</p>
          <h1 className="text-2xl font-bold text-foreground">{adm.title}</h1>
        </div>
        <p className="text-xs text-muted pb-0.5">
          {admin.display_name ?? admin.email ?? "Admin"}
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(({ href, icon: Icon, title, description, meta, enabled }) =>
          enabled ? (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-4 bg-surface rounded-2xl border border-border shadow-sm px-5 py-4 hover:border-orange-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">{description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {meta && (
                  <span className="text-xs text-muted font-medium">{meta}</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-orange-400 transition-colors" />
              </div>
            </Link>
          ) : (
            <div
              key={title}
              className="flex items-center gap-4 bg-surface rounded-2xl border border-border px-5 py-4 opacity-50 cursor-not-allowed select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-muted">{title}</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">{description}</p>
              </div>
              <span className="text-xs text-muted font-medium shrink-0 px-2.5 py-1 rounded-full bg-elevated">
                {meta}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
