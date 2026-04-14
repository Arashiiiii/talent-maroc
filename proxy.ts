import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only redirect /protected → /dashboard (kill Supabase starter page)
  // Do NOT touch /dashboard — let the client-side handle auth
  // This avoids the cookie vs localStorage session mismatch that causes fake logouts
  if (pathname.startsWith("/protected")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*"],
};