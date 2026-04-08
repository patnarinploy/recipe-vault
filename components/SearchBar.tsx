"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) {
      next.set("q", value.trim());
    } else {
      next.delete("q");
    }
    next.delete("cat"); // reset category on new search
    router.push(`/?${next.toString()}`);
  }

  function handleClear() {
    setValue("");
    const next = new URLSearchParams(params.toString());
    next.delete("q");
    router.push(`/?${next.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 relative flex items-center">
      <Search className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ค้นหาสูตรอาหาร…"
        className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-stone-400 hover:text-stone-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}
