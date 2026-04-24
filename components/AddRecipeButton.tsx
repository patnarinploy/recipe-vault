"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import Modal from "./Modal";
import RecipeForm from "./RecipeForm";

type Variant = "navbar" | "hero" | "link";

const VARIANT_CLASSES: Record<Variant, string> = {
  navbar:
    "inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm",
  hero:
    "inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0",
  link: "mt-3 inline-block text-orange-500 hover:underline text-sm",
};

interface Props {
  variant?: Variant;
  label?: string;
  showIcon?: boolean;
}

export default function AddRecipeButton({
  variant = "hero",
  label = "เพิ่มสูตรอาหาร",
  showIcon = true,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={VARIANT_CLASSES[variant]}
      >
        {showIcon && variant !== "link" && <PlusCircle className="w-4 h-4" />}
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="เพิ่มสูตรอาหารใหม่">
        <RecipeForm
          inModal
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
