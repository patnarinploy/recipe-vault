"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "./Modal";
import { ChefHat, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "login" | "signup";
type Stage = "form" | "email_sent";

const REDIRECT_BASE = typeof window !== "undefined" ? window.location.origin : "";

// Map Supabase error codes / messages to human-readable Thai
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials"))
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed"))
    return "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "อีเมลนี้มีบัญชีอยู่แล้ว — ลองเข้าสู่ระบบแทน";
  if (m.includes("password should be") || m.includes("weak_password"))
    return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  if (m.includes("rate limit") || m.includes("too_many_requests"))
    return "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
  if (m.includes("network") || m.includes("fetch"))
    return "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต";
  if (m.includes("validation_failed") || m.includes("unsupported provider") || m.includes("provider is not enabled"))
    return "ระบบเข้าสู่ระบบนี้ยังไม่พร้อมใช้งาน";
  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export default function AuthModal({ open, onClose }: Props) {
  const [tab, setTab]       = useState<Tab>("login");
  const [stage, setStage]   = useState<Stage>("form");
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [showPass, setShow] = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const supabase = createClient();

  function reset() {
    setStage("form"); setEmail(""); setPass(""); setError(null); setLoad(false); setShow(false);
  }

  function switchTab(t: Tab) { setTab(t); reset(); }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoad(true); setError(null);

    if (tab === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(friendlyError(err.message)); setLoad(false); return; }
      toast.success("เข้าสู่ระบบสำเร็จ");
      onClose();
      window.location.href = "/";
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${REDIRECT_BASE}/auth/callback` },
      });
      if (err) { setError(friendlyError(err.message)); setLoad(false); return; }
      setStage("email_sent");
      setLoad(false);
    }
  }

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} maxWidth="max-w-sm">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-stone-100">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-2xl mb-3">
            <ChefHat className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">Recipe Vault</h2>
          <p className="text-sm text-stone-400 mt-0.5">
            {tab === "login" ? "เข้าสู่ระบบเพื่อจัดการสูตรอาหาร" : "สร้างบัญชีใหม่ฟรี"}
          </p>
        </div>

        {stage === "email_sent" ? (
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">ตรวจสอบอีเมลของคุณ</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              เราส่งลิงก์ยืนยันไปที่{" "}
              <span className="font-medium text-stone-700">{email}</span>{" "}
              แล้ว — กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
            </p>
            <button onClick={() => { reset(); onClose(); }}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              ปิด
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Tab toggle */}
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
              {(["login", "signup"] as Tab[]).map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === t ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  }`}>
                  {t === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </button>
              ))}
            </div>

            {/* Email + Password form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="อีเมล" required autoComplete="email"
                className={inputCls} />

              <div className="relative">
                <input value={password} onChange={e => setPass(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder={tab === "login" ? "รหัสผ่าน" : "รหัสผ่าน (อย่างน้อย 6 ตัว)"}
                  required minLength={6}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  className={inputCls} style={{ paddingRight: "2.75rem" }} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
                {loading ? "กำลังดำเนินการ…" : tab === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
              </button>
            </form>

            {tab === "login" && (
              <p className="text-center text-xs text-stone-400">
                ยังไม่มีบัญชี?{" "}
                <button onClick={() => switchTab("signup")}
                  className="text-orange-500 hover:text-orange-600 font-medium">
                  สมัครสมาชิก
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
