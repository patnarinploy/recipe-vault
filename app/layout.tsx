import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";
import { Sarabun, IBM_Plex_Sans_Thai, Playfair_Display, JetBrains_Mono, La_Belle_Aurore } from "next/font/google";

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

  return (
    <html lang="th" className={`${sarabun.variable} ${ibmPlexSansThai.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${laBelleAurore.variable}`} suppressHydrationWarning>
      <body className="bg-stone-50 min-h-screen font-sans" suppressHydrationWarning>
        {user && <Navbar />}
        <main className={user ? "max-w-6xl mx-auto px-4 sm:px-6 py-10" : ""}>
          {children}
        </main>
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
