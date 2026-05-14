import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await supabase
    .from("users")
    .update({ last_seen: new Date().toISOString() })
    .eq("auth_id", user.id);

  return NextResponse.json({ ok: true });
}
