import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kill the Supabase starter /protected page
  if (pathname.startsWith("/protected")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // For /dashboard: check if a Supabase session cookie exists
  // Supabase stores the session in a cookie named sb-<project>-auth-token
  // We check for ANY sb-*-auth-token cookie to detect a logged-in session
  if (pathname.startsWith("/dashboard")) {
    const cookies = request.cookies.getAll();
    const hasSession = cookies.some(
      c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && c.value
    );

    // Also check the Supabase access token cookie (used by @supabase/ssr)
    const hasAccessToken = cookies.some(
      c => (c.name.includes("access-token") || c.name.includes("auth-token")) && c.value
    );

    if (!hasSession && !hasAccessToken) {
      // No session cookie at all — definitely not logged in
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/protected/:path*"],
};