import { cookies } from "next/headers";
import { th } from "./th";
import { en } from "./en";
import type { Locale, Dict } from ".";

export async function getServerLocale(): Promise<{ locale: Locale; t: Dict }> {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("rv_locale")?.value ?? "th") as Locale;
  const t: Dict = locale === "en" ? en as Dict : th as Dict;
  return { locale, t };
}
