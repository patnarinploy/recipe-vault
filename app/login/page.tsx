"use client";

import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function LoginPage() {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(true); }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 dark:bg-orange-900/20 rounded-2xl mb-4">
          <ChefHat className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Recipe Vault</h1>
        <p className="text-secondary text-sm mt-1">เข้าสู่ระบบเพื่อจัดการสูตรอาหาร</p>
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
