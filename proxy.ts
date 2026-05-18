import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Routes that work without a session (browse, search, public seller info). */
function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;

  if (pathname === "/api/admin/setup" && method === "POST") return true;

  if (method !== "GET" && method !== "HEAD") return false;

  if (pathname === "/api/categories") return true;
  if (pathname.startsWith("/api/listings")) return true;
  if (/^\/api\/users\/\d+$/.test(pathname)) return true;
  if (pathname.startsWith("/api/feedback/seller/")) return true;

  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (isPublicApi(pathname, req.method)) {
      return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
