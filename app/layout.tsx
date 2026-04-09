import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Recipe Vault",
  description: "คลังสูตรอาหารส่วนตัว",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-stone-50 min-h-screen font-sans">
        {user && <Navbar />}
        <main className={user ? "max-w-6xl mx-auto px-4 sm:px-6 py-10" : ""}>
          {children}
        </main>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "Sarabun, sans-serif", fontSize: "14px" } }} />
      </body>
    </html>
  );
}
