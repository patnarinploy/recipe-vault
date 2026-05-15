import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";
import { Sarabun, IBM_Plex_Sans_Thai, Playfair_Display, JetBrains_Mono, La_Belle_Aurore } from "next/font/google";
import { redirect } from "next/navigation";
import Heartbeat from "@/components/Heartbeat";

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

  // Banned user gate — shown regardless of page
  if (user && user.status === "banned") {
    return (
      <html lang="th" className={`${sarabun.variable} ${ibmPlexSansThai.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${laBelleAurore.variable}`} suppressHydrationWarning>
        <body className="bg-stone-50 min-h-screen font-sans flex items-center justify-center px-4" suppressHydrationWarning>
          <div className="max-w-sm w-full bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">บัญชีถูกระงับ</h1>
            {user.banned_reason && (
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                เหตุผล: <span className="font-medium text-red-600">{user.banned_reason}</span>
              </p>
            )}
            <p className="text-xs text-stone-400">หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>
            <form action="/api/auth/signout" method="POST" className="mt-6">
              <button type="submit" className="text-sm text-stone-500 hover:text-stone-700 underline">
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
    <html lang="th" className={`${sarabun.variable} ${ibmPlexSansThai.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${laBelleAurore.variable}`} suppressHydrationWarning>
      <body className="bg-stone-50 min-h-screen font-sans" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
