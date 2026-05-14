import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that never require auth (pass through unconditionally)
const ALWAYS_PUBLIC = [
  "/login",
  "/signup",
  "/auth",
  "/api/db-status",
  "/api/heartbeat",
];

// Paths that always require a valid session
const REQUIRES_AUTH = [
  "/settings",
  "/admin",
  "/onboarding",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase SSR: must refresh session tokens on every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (ALWAYS_PUBLIC.some(p => pathname.startsWith(p))) return supabaseResponse;
  if (pathname === "/") return supabaseResponse;

  if (REQUIRES_AUTH.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
