"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { Settings, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import type { User } from "@/lib/types";
import { isAvatarUrl } from "@/lib/avatar";
import DbStatus from "./DbStatus";
import { useLocale } from "@/lib/locale";

export default function UserMenu({ user, locked }: { user: User; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasName       = !!user.display_name;
  const avatarInitial = hasName
    ? user.display_name![0].toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-elevated transition-colors text-sm font-medium text-secondary"
      >
        {isAvatarUrl(user.avatar) ? (
          <img src={user.avatar!} alt={user.display_name ?? user.email ?? ""} draggable={false}
            className="w-7 h-7 rounded-full object-cover shrink-0 pointer-events-none select-none" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {avatarInitial}
          </span>
        )}
        {hasName ? (
          <span className="max-w-[120px] truncate">{user.display_name}</span>
        ) : (
          <span className="max-w-[120px] truncate italic text-muted font-normal">{t.nav.noName}</span>
        )}
        {user.role === "admin" && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS.admin}`}>
            {ROLE_LABELS.admin}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-lg border border-border py-1.5 z-50">
          <div className="px-4 py-2 border-b border-border mb-1">
            {hasName ? (
              <p className="text-sm font-semibold text-foreground truncate">{user.display_name}</p>
            ) : (
              <p className="text-sm italic text-muted truncate">{t.nav.noName}</p>
            )}
            {user.email && <p className="text-xs text-muted truncate">{user.email}</p>}
          </div>

          {!locked && (
            <>
              <Link href="/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated transition-colors">
                <Settings className="w-4 h-4 text-muted" />
                {t.nav.settings}
              </Link>

              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-muted" />
                  {t.nav.systemManagement}
                </Link>
              )}
            </>
          )}

          {/* border-t only when nav items are above; when locked the identity block's border-b already separates */}
          <div className={!locked ? "border-t border-border mt-1 pt-1" : "pt-1"}>
            <form action={logout}>
              <button type="submit"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                <LogOut className="w-4 h-4" />
                {t.nav.logout}
              </button>
            </form>
          </div>

          <div className="border-t border-border px-4 pt-2 pb-1 flex justify-center">
            <DbStatus />
          </div>
        </div>
      )}
    </div>
  );
}
