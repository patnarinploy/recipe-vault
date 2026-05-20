import { requireSession } from "@/lib/session";
import { getShoppingList } from "@/app/actions/shopping";
import { getUserStores, getIngredientStorePrefs } from "@/app/actions/stores";
import { getServerLocale } from "@/lib/locale/server";
import ShoppingClient from "./ShoppingClient";

export const revalidate = 0;

export default async function ShoppingPage() {
  await requireSession();
  const [items, stores, storePrefs, { locale }] = await Promise.all([
    getShoppingList(),
    getUserStores(),
    getIngredientStorePrefs(),
    getServerLocale(),
  ]);

  return (
    <ShoppingClient
      initialItems={items}
      initialStores={stores}
      initialStorePrefs={storePrefs}
      locale={locale}
    />
  );
}
