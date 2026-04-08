import Link from "next/link";
import { ChefHat, PlusCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-stone-800 text-lg hover:text-orange-500 transition-colors"
        >
          <ChefHat className="w-5 h-5 text-orange-500" />
          Recipe Vault
        </Link>

        <Link
          href="/recipes/new"
          className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">เพิ่มสูตร</span>
        </Link>
      </div>
    </header>
  );
}
