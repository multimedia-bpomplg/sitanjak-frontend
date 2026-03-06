import { NextRequest, NextResponse } from "next/server";

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
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));

          if (payload?.roles?.includes("superadmin")) {
            return NextResponse.next();
          }
        } catch {}
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
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
