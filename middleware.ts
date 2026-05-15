import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALWAYS_PUBLIC = ["/login", "/signup", "/auth", "/api/db-status", "/api/heartbeat"];
const REQUIRES_AUTH = ["/settings", "/admin", "/onboarding"];
// Onboarding lock — exempt from the redirect-to-onboarding rule
const ONBOARDING_EXEMPT = ["/onboarding", "/auth", "/api", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  // Stamp pathname so layout.tsx server components can read it for Navbar locked state
  supabaseResponse.headers.set("x-pathname", pathname);

  if (ALWAYS_PUBLIC.some(p => pathname.startsWith(p))) return supabaseResponse;

  // Unauthenticated → redirect to login for protected paths
  if (REQUIRES_AUTH.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Onboarding lock — authenticated users who haven't completed onboarding
  // are redirected to /onboarding from ALL non-exempt routes (including /)
  if (user && !ONBOARDING_EXEMPT.some(p => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_complete")
      .eq("auth_id", user.id)
      .single<{ onboarding_complete: boolean }>();

    if (profile && !profile.onboarding_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
