import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  backHref?: string;
  backLabel?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
};

export default function AdminLayout({
  title,
  backHref = "/admin",
  backLabel = "การจัดการระบบ",
  maxWidth = "lg",
  children,
}: Props) {
  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[maxWidth];

  return (
    <div className={`${widthClass} mx-auto`}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">{title}</h1>

      {children}
    </div>
  );
}
