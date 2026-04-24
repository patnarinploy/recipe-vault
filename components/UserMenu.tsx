"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Settings, Users, LogOut, ChevronDown } from "lucide-react";
import type { User } from "@/lib/types";
import DbStatus from "./DbStatus";

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors text-sm font-medium text-stone-700"
      >
        {/* Avatar circle */}
        <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {user.username[0].toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate">{user.username}</span>
        {user.role === "admin" && (
          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">
            Admin
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-50">
          <div className="px-4 py-2 border-b border-stone-100 mb-1">
            <p className="text-xs text-stone-400">เข้าสู่ระบบในฐานะ</p>
            <p className="text-sm font-semibold text-stone-800 truncate">{user.username}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-stone-400" />
            เปลี่ยนรหัสผ่าน
          </Link>

          {user.role === "admin" && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Users className="w-4 h-4 text-stone-400" />
              จัดการผู้ใช้
            </Link>
          )}

          <div className="border-t border-stone-100 mt-1 pt-1">
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </form>
          </div>

          <div className="border-t border-stone-100 px-4 pt-2 pb-1 flex justify-center">
            <DbStatus />
          </div>
        </div>
      )}
    </div>
  );
}
