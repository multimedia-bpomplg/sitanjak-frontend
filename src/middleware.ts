import { NextRequest, NextResponse } from "next/server";
import { isJwtExpired, parseJwtPayload } from "./lib/authSession";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // ===============================
  // BIARKAN FILE STATIC LEWAT
  // ===============================
  if (
    path.startsWith("/_next") ||
    path.startsWith("/images") ||
    path.startsWith("/api") ||
    path.startsWith("/aboutdev") ||
    path.match(/\.(png|jpg|jpeg|svg|ico|webp)$/) ||
    path === "/manifest.webmanifest" ||
    path === "/manifest.json" ||
    path === "/sw.js" ||
    path === "/offline.html" ||
    path === "/sitemap.xml" ||
    path === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // ===============================
  // 🔥 CEK MAINTENANCE
  // ===============================
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/maintenance/status`,
      { cache: "no-store" },
    );

    const data = await res.json();

    if (data?.isActive === true) {
      if (path.startsWith("/maintenance")) {
        return NextResponse.next();
      }

      if (path.startsWith("/auth/core-gateway")) {
        return NextResponse.next();
      }

      // superadmin bypass
      if (token && !isJwtExpired(token)) {
        const payload = parseJwtPayload(token);
        if (payload?.roles?.includes("superadmin")) {
          return NextResponse.next();
        }
      }

      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  } catch (err) {
    console.error("Maintenance fetch error:", err);
  }

  // ===============================
  // PUBLIC ROUTES
  // ===============================
  if (
    path === "/" ||
    path.startsWith("/auth") ||
    path.startsWith("/pendaftaran") ||
    path.startsWith("/403")
  ) {
    return NextResponse.next();
  }

  // ===============================
  // AUTH PROTECTION
  // ===============================
  if (!token || isJwtExpired(token)) {
    const loginUrl = new URL("/auth/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete("token");
      response.cookies.delete("roles");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
