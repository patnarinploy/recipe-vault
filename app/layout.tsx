import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";
import { Sarabun, Playfair_Display } from "next/font/google";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recipe Vault",
  description: "คลังสูตรอาหารส่วนตัว",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="th" className={`${sarabun.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <body className="bg-stone-50 min-h-screen font-sans" suppressHydrationWarning>
        {user && <Navbar />}
        <main className={user ? "max-w-6xl mx-auto px-4 sm:px-6 py-10" : ""}>
          {children}
        </main>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "Thonburi, Sarabun, sans-serif", fontSize: "14px" } }} />
      </body>
    </html>
  );
}
