import Image from "next/image";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

type Props = {
  recipe: Recipe;
  currentUserId?: string;
};

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-48 bg-orange-50">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">🍽</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {recipe.category && (
          <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium">
            {recipe.category}
          </span>
        )}
        <h2 className="font-semibold text-gray-800 mt-1 mb-1 line-clamp-1">{recipe.title}</h2>
        {recipe.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
        )}

        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          {recipe.cook_time_minutes && <span>⏱ {recipe.cook_time_minutes} นาที</span>}
          {recipe.servings && <span>🍽 {recipe.servings} ที่</span>}
        </div>
      </div>
    </Link>
  );
}
