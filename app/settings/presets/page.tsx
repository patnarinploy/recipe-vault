import { requireSession } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerLocale } from "@/lib/locale/server";
import { getUserPresetUnits, getUserPresetCategories, getUserPresetIngredients } from "@/app/actions/user-presets";
import { getUserStores, getIngredientStorePrefs } from "@/app/actions/stores";
import UserDropdownsClient from "./UserDropdownsClient";

export const revalidate = 0;

export default async function SettingsDropdownsPage() {
  await requireSession();
  const { t } = await getServerLocale();
  const d = t.settings.dropdowns;

  const [units, categories, ingredients, stores, storePrefs] = await Promise.all([
    getUserPresetUnits(),
    getUserPresetCategories(),
    getUserPresetIngredients(),
    getUserStores(),
    getIngredientStorePrefs(),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.settings.title}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-2">{d.title}</h1>
      <p className="text-sm text-muted mb-8">{d.autoCreatedNote}</p>

      <UserDropdownsClient
        units={units}
        categories={categories}
        ingredients={ingredients}
        stores={stores}
        storePrefs={storePrefs}
      />
    </div>
  );
}
