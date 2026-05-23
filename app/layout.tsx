import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";
import { Sarabun, IBM_Plex_Sans_Thai, Playfair_Display, JetBrains_Mono, La_Belle_Aurore, Kanit, Mitr, Noto_Sans_Thai, Prompt } from "next/font/google";
import { redirect } from "next/navigation";
import Heartbeat from "@/components/Heartbeat";
import { ThemeProvider } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/locale";
import { ReadingFontProvider } from "@/lib/reading-font-context";
import { READING_FONTS } from "@/lib/reading-fonts";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
  display: "swap",
});
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-ibm-plex",
  display: "swap",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jetbrains",
  display: "swap",
});
const laBelleAurore = La_Belle_Aurore({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-belle-aurore",
  display: "swap",
});
const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-kanit",
  display: "swap",
});
const mitr = Mitr({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-mitr",
  display: "swap",
});
const notoSansThai = Noto_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});
const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recipe Vault",
  description: "คลังสูตรอาหารส่วนตัว",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  // Lock navbar when the user hasn't completed onboarding yet.
  // Derived from user.onboarding_complete (source of truth) rather than pathname,
  // so it unlocks immediately after the server action calls revalidatePath.
  const isOnboarding = !!user && !user.onboarding_complete;

  // Single inline init script: sync DB prefs into localStorage, then apply theme.
  // One script tag avoids ordering uncertainty between two separate tags in <head>.
  // Values are whitelist-validated to prevent script injection.
  const prefs = (user?.preferences as Record<string, string>) ?? {};
  const validTheme  = ["light", "dark", "system"].includes(prefs.theme)    ? prefs.theme          : null;
  const validLocale = ["th", "en"].includes(prefs.locale)                  ? prefs.locale         : null;
  const validFont   = READING_FONTS.some(f => f.id === prefs.reading_font) ? prefs.reading_font   : null;
  const validFlip   = ["soft", "hard"].includes(prefs.page_flip_type)      ? prefs.page_flip_type : null;
  const INIT_SCRIPT = user
    ? `try{${[
        validTheme  ? `localStorage.setItem("rv_theme","${validTheme}");`  : "",
        validLocale ? `localStorage.setItem("rv_locale","${validLocale}");document.cookie="rv_locale=${validLocale};path=/;max-age=31536000;SameSite=Lax";` : "",
        validFont   ? `localStorage.setItem("rv_reading_font","${validFont}");`  : "",
        validFlip   ? `localStorage.setItem("rv_page_flip_type","${validFlip}");` : "",
        `var t=localStorage.getItem("rv_theme")||"light";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark");`,
      ].join("")}}catch(e){}`
    // Guest: always force light — ignore any previously stored dark preference
    : `try{localStorage.setItem("rv_theme","light");}catch(e){}`;

  const allFontVars = [
    sarabun.variable,
    ibmPlexSansThai.variable,
    playfairDisplay.variable,
    jetbrainsMono.variable,
    laBelleAurore.variable,
    kanit.variable,
    mitr.variable,
    notoSansThai.variable,
    prompt.variable,
  ].join(" ");

  // Banned user gate — shown regardless of page
  if (user && user.status === "banned") {
    return (
      <html lang="th" className={allFontVars} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        </head>
        <body className="bg-background min-h-screen font-sans flex items-center justify-center px-4" suppressHydrationWarning>
          <div className="max-w-sm w-full bg-surface rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">บัญชีถูกระงับ</h1>
            {user.banned_reason && (
              <p className="text-sm text-secondary mb-4 leading-relaxed">
                เหตุผล: <span className="font-medium text-red-600">{user.banned_reason}</span>
              </p>
            )}
            <p className="text-xs text-muted">หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>
            <form action="/api/auth/signout" method="POST" className="mt-6">
              <button type="submit" className="text-sm text-secondary hover:text-foreground underline">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </body>
      </html>
    );
  }

  // Onboarding gate — redirect new users to complete profile before anything else
  // (Only for protected routes — guests and /onboarding itself are exempt)

  return (
    <html lang="th" className={allFontVars} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} /></head>
      <body className="bg-background min-h-screen font-sans" suppressHydrationWarning>
        <LocaleProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={400}>
            <ReadingFontProvider>
              <Navbar user={user} locked={isOnboarding} />
              <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                {children}
              </main>
              {user && <Heartbeat />}
              <Toaster
                position="top-right"
                toastOptions={{ style: { fontFamily: "Thonburi, Sarabun, sans-serif", fontSize: "14px" } }}
                richColors
                closeButton
              />
            </ReadingFontProvider>
            </TooltipProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
