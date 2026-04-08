"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  categories: string[];
  active?: string;
};

export default function CategoryFilter({ categories, active }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function navigate(cat?: string) {
    const next = new URLSearchParams(params.toString());
    if (cat) {
      next.set("cat", cat);
    } else {
      next.delete("cat");
    }
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => navigate()}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !active
            ? "bg-orange-500 text-white"
            : "bg-white border border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-500"
        }`}
      >
        ทั้งหมด
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => navigate(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? "bg-orange-500 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-500"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
