import Link from "next/link";
import { ChefHat } from "lucide-react";
import UserMenu from "./UserMenu";
import GuestAuthButton from "./GuestAuthButton";
import type { User } from "@/lib/types";

export default function Navbar({ user }: { user: User | null }) {
  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-extrabold text-stone-800 text-xl hover:text-orange-500 transition-colors shrink-0"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline">Recipe Vault</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <GuestAuthButton />
          )}
        </div>
      </div>
    </header>
  );
}
