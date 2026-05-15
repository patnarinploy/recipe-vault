import Link from "next/link";
import { ChefHat } from "lucide-react";
import UserMenu from "./UserMenu";
import GuestAuthButton from "./GuestAuthButton";
import type { User } from "@/lib/types";

export default function Navbar({ user, locked }: { user: User | null; locked?: boolean }) {
  const logoInner = (
    <>
      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
        <ChefHat className="w-4 h-4 text-white" />
      </div>
      <span className="hidden sm:inline">Recipe Vault</span>
    </>
  );

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {locked ? (
          <span className="inline-flex items-center gap-2 font-extrabold text-stone-800 text-xl shrink-0 cursor-default select-none">
            {logoInner}
          </span>
        ) : (
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-stone-800 text-xl hover:text-orange-500 transition-colors shrink-0">
            {logoInner}
          </Link>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} locked={locked} />
          ) : (
            <GuestAuthButton />
          )}
        </div>
      </div>
    </header>
  );
}
