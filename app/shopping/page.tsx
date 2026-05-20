import { requireSession } from "@/lib/session";
import { getShoppingList } from "@/app/actions/shopping";
import { getServerLocale } from "@/lib/locale/server";
import ShoppingClient from "./ShoppingClient";

export const revalidate = 0;

export default async function ShoppingPage() {
  await requireSession();
  const [items, { locale }] = await Promise.all([
    getShoppingList(),
    getServerLocale(),
  ]);

  return <ShoppingClient initialItems={items} locale={locale} />;
}
