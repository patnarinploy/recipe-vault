import Image from "next/image";
import Link from "next/link";
import { Clock, Users, Tag } from "lucide-react";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-48 bg-orange-50 shrink-0">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl select-none">
            🍽️
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {recipe.category && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
            <Tag className="w-3 h-3" />
            {recipe.category}
          </span>
        )}

        <h2 className="font-semibold text-stone-800 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {recipe.title}
        </h2>

        {recipe.description && (
          <p className="text-sm text-stone-500 line-clamp-2 flex-1">
            {recipe.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex gap-3 text-xs text-stone-400 pt-1">
          {recipe.cook_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.cook_time_minutes} นาที
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} ที่
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
