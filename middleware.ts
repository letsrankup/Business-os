import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/analytics",
    "/seo",
    "/geo",
    "/crm",
    "/leads",
    "/billing",
    "/settings"
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get("sb-access-token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/seo/:path*",
    "/geo/:path*",
    "/crm/:path*",
    "/leads/:path*",
    "/billing/:path*",
    "/settings/:path*"
  ]
};
