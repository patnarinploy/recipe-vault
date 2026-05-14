import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/session";

export default async function PasswordPage() {
  const user = await requireSession();

  const provider = user.auth_provider
    ? { google: "Google", azure: "Microsoft", email: "Email" }[user.auth_provider] ?? user.auth_provider
    : "OAuth";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        ตั้งค่า
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">ความปลอดภัย</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">บัญชีจัดการโดย {provider}</p>
            <p className="text-xs text-stone-400 mt-0.5">รหัสผ่านและความปลอดภัยดูแลโดย {provider}</p>
          </div>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed">
          บัญชีของคุณเข้าสู่ระบบผ่าน <strong>{provider}</strong> —
          รหัสผ่านจึงไม่ได้เก็บอยู่ใน Recipe Vault
          หากต้องการเปลี่ยนรหัสผ่านหรือตั้งค่าความปลอดภัย
          กรุณาดำเนินการผ่านบัญชี {provider} ของคุณโดยตรง
        </p>
      </div>
    </div>
  );
}
