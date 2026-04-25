import Link from "next/link";
import { ChefHat, Library as LibraryIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import UserMenu from "./UserMenu";
import BookV2Trigger from "./BookV2Trigger";

export default async function Navbar() {
  const user = await getSession();

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-extrabold text-stone-800 text-xl hover:text-orange-500 transition-colors shrink-0"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="hidden sm:inline">Recipe Vault</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <LibraryIcon className="w-4 h-4" />
              <span>ชั้นหนังสือ</span>
            </Link>
            <BookV2Trigger />
            <UserMenu user={user} />
          </div>
        )}
      </div>
    </header>
  );
}
