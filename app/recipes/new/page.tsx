import RecipeForm from "@/components/RecipeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">
        เพิ่มสูตรอาหารใหม่
      </h1>
      <RecipeForm />
    </div>
  );
}
