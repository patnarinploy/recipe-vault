"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "./Modal";
import { ChefHat } from "lucide-react";
import { useLocale } from "@/lib/locale";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Env-var gates evaluated at build time.
// Set NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true and/or NEXT_PUBLIC_AUTH_AZURE_ENABLED=true
// in .env.local once each provider is configured in the Supabase dashboard.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
const AZURE_ENABLED  = process.env.NEXT_PUBLIC_AUTH_AZURE_ENABLED  === "true";

const REDIRECT_BASE  = typeof window !== "undefined" ? window.location.origin : "";

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("provider is not enabled") || m.includes("validation_failed") || m.includes("unsupported provider"))
    return "ระบบเข้าสู่ระบบนี้ยังไม่พร้อมใช้งาน";
  if (m.includes("popup") || m.includes("cancelled") || m.includes("closed by user"))
    return "การเข้าสู่ระบบถูกยกเลิก";
  if (m.includes("redirect") || m.includes("mismatch") || m.includes("redirect_uri"))
    return "การตั้งค่า redirect ไม่ถูกต้อง — กรุณาติดต่อผู้ดูแลระบบ";
  if (m.includes("rate limit") || m.includes("too_many"))
    return "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
  if (m.includes("network") || m.includes("fetch"))
    return "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต";
  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

type Provider = "google" | "azure";
type LoadingState = Provider | null;

export default function AuthModal({ open, onClose }: Props) {
  const [loading, setLoading]   = useState<LoadingState>(null);
  const [error, setError]       = useState<string | null>(null);
  const { t } = useLocale();
  const auth = t.auth;

  const supabase = createClient();

  async function handleOAuth(provider: Provider) {
    setLoading(provider);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${REDIRECT_BASE}/auth/callback` },
    });
    if (err) {
      setError(friendlyError(err.message));
      setLoading(null);
    }
    // On success the browser navigates away — no cleanup needed
  }

  const anyProviderEnabled = GOOGLE_ENABLED || AZURE_ENABLED;

  return (
    <Modal open={open} onClose={() => { setError(null); setLoading(null); onClose(); }} maxWidth="max-w-sm">
      <div className="bg-surface rounded-2xl border border-border shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="inline-flex items-center justify-center w-13 h-13 bg-orange-100 dark:bg-orange-900/20 rounded-2xl mb-4">
            <ChefHat className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{auth.signIn}</h2>
          <p className="text-sm text-muted mt-1">{auth.subtitle}</p>
        </div>

        <div className="px-6 pb-7 space-y-3">

          {/* Google */}
          <ProviderButton
            enabled={GOOGLE_ENABLED}
            loading={loading === "google"}
            anyLoading={loading !== null}
            onClick={() => handleOAuth("google")}
            connectingLabel={auth.connecting}
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
            label="Continue with Google"
            disabledLabel={auth.googleUnavailable}
          />

          {/* Microsoft */}
          <ProviderButton
            enabled={AZURE_ENABLED}
            loading={loading === "azure"}
            anyLoading={loading !== null}
            onClick={() => handleOAuth("azure")}
            connectingLabel={auth.connecting}
            icon={
              <svg viewBox="0 0 21 21" className="w-5 h-5 shrink-0">
                <path fill="#f35325" d="M0 0h10v10H0z"/>
                <path fill="#81bc06" d="M11 0h10v10H11z"/>
                <path fill="#05a6f0" d="M0 11h10v10H0z"/>
                <path fill="#ffba08" d="M11 11h10v10H11z"/>
              </svg>
            }
            label="Continue with Microsoft"
            disabledLabel={auth.microsoftUnavailable}
          />

          {/* No providers at all */}
          {!anyProviderEnabled && (
            <div className="rounded-xl bg-elevated border border-outline px-4 py-4 text-center">
              <p className="text-sm text-secondary leading-relaxed">
                {auth.setupPending}<br />
                {t.common.contactAdmin}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-center">{error}</p>
          )}

          <p className="text-center text-xs text-muted pt-1 leading-relaxed">
            {auth.terms}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function ProviderButton({
  enabled,
  loading,
  anyLoading,
  onClick,
  icon,
  label,
  disabledLabel,
  connectingLabel,
}: {
  enabled: boolean;
  loading: boolean;
  anyLoading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabledLabel: string;
  connectingLabel: string;
}) {
  if (!enabled) {
    return (
      <div className="w-full flex items-center justify-between gap-3 border border-outline rounded-xl px-4 py-3.5 text-sm text-muted bg-elevated cursor-not-allowed select-none">
        <div className="flex items-center gap-3">
          <span className="opacity-40">{icon}</span>
          <span className="font-medium">{disabledLabel}</span>
        </div>
        <span className="text-[10px] bg-elevated text-muted px-2 py-0.5 rounded-full font-semibold shrink-0 border border-outline">Coming soon</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={anyLoading}
      className="w-full flex items-center gap-3 border border-outline rounded-xl px-4 py-3.5 text-sm font-semibold text-secondary hover:bg-elevated hover:border-outline active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-5 h-5 shrink-0 rounded-full border-2 border-muted border-t-orange-500 animate-spin" />
      ) : icon}
      <span className="flex-1 text-left">{loading ? connectingLabel : label}</span>
    </button>
  );
}
