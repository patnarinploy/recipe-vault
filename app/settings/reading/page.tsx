import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import ReadingSettingsClient from "./ReadingSettingsClient";

type ReadingPreferences = {
  theme?: string;
  locale?: string;
  reading_font?: string;
  page_flip_type?: string;
};

export default async function ReadingPage() {
  const user = await getSession();
  let initialPreferences: ReadingPreferences = {};

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .single();
    initialPreferences = (data?.preferences as ReadingPreferences) ?? {};
  }

  return <ReadingSettingsClient initialPreferences={initialPreferences} />;
}
