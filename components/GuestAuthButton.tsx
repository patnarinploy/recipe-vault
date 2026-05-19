"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import AuthModal from "./AuthModal";
import { useLocale } from "@/lib/locale";

export default function GuestAuthButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
      >
        <LogIn className="w-4 h-4" />
        {t.common.login}
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
