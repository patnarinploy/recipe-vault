import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      ok: !error,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  }
}
