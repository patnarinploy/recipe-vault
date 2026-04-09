import Link from "next/link";
import { ChefHat, PlusCircle, Settings, Users, LogOut } from "lucide-react";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

export default async function Navbar() {
  const user = await getSession();

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-stone-800 text-lg hover:text-orange-500 transition-colors">
          <ChefHat className="w-5 h-5 text-orange-500" />
          Recipe Vault
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            <Link href="/recipes/new" className="inline-flex items-center gap-1.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-sm transition-colors">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มสูตร</span>
            </Link>

            {user.role === "admin" && (
              <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-sm transition-colors">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">ผู้ใช้</span>
              </Link>
            )}

            <Link href="/settings" className="inline-flex items-center gap-1.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{user.username}</span>
            </Link>

            <form action={logout}>
              <button type="submit" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
