"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "./Modal";
import { ChefHat, Mail, Eye, EyeOff, Chrome } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "login" | "signup";
type Stage = "form" | "email_sent";

const REDIRECT_BASE = typeof window !== "undefined" ? window.location.origin : "";

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

  async function handleOAuth(provider: "google" | "azure") {
    setLoad(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${REDIRECT_BASE}/auth/callback` },
    });
    if (error) { setError(error.message); setLoad(false); }
    // On success the browser navigates away — no need to reset
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoad(true); setError(null);

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(error.message); setLoad(false); return; }
      toast.success("เข้าสู่ระบบสำเร็จ");
      onClose();
      window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${REDIRECT_BASE}/auth/callback` },
      });
      if (error) { setError(error.message); setLoad(false); return; }
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
              เราส่งลิงก์ยืนยันไปที่ <span className="font-medium text-stone-700">{email}</span> แล้ว
              กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
            </p>
            <button onClick={() => { reset(); onClose(); }} className="text-sm text-orange-500 hover:text-orange-600 font-medium">
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

            {/* OAuth buttons */}
            <div className="space-y-2">
              <button onClick={() => handleOAuth("google")} disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {tab === "login" ? "เข้าสู่ระบบด้วย Google" : "สมัครด้วย Google"}
              </button>

              <button onClick={() => handleOAuth("azure")} disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                  <path fill="#f35325" d="M0 0h10v10H0z"/><path fill="#81bc06" d="M11 0h10v10H11z"/>
                  <path fill="#05a6f0" d="M0 11h10v10H0z"/><path fill="#ffba08" d="M11 11h10v10H11z"/>
                </svg>
                {tab === "login" ? "เข้าสู่ระบบด้วย Microsoft" : "สมัครด้วย Microsoft"}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">หรือใช้อีเมล</span>
              <div className="flex-1 h-px bg-stone-200" />
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
                  required minLength={6} autoComplete={tab === "login" ? "current-password" : "new-password"}
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
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                <Chrome className="w-4 h-4 opacity-0 absolute" />
                {loading ? "กำลังดำเนินการ…" : tab === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
              </button>
            </form>

            {tab === "login" && (
              <p className="text-center text-xs text-stone-400">
                ยังไม่มีบัญชี?{" "}
                <button onClick={() => switchTab("signup")} className="text-orange-500 hover:text-orange-600 font-medium">
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
