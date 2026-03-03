import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // ===============================
  // BIARKAN ASSET LEWAT
  // ===============================
  if (
    path.startsWith("/_next") ||
    path.startsWith("/images") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // ===============================
  // 🔥 CEK MAINTENANCE DULU
  // ===============================
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/maintenance/status`,
      { cache: "no-store" },
    );

    const data = await res.json();

    if (data?.isActive === true) {
      // izinkan halaman maintenance
      if (path.startsWith("/maintenance")) {
        return NextResponse.next();
      }

      // izinkan core-gateway
      if (path.startsWith("/auth/core-gateway")) {
        return NextResponse.next();
      }

      // izinkan superadmin
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.roles?.includes("superadmin")) {
            return NextResponse.next();
          }
        } catch {}
      }

      // selain itu redirect
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  } catch (err) {
    console.error("Maintenance fetch error:", err);
  }

  // ===============================
  // PUBLIC ROUTES (HANYA JIKA MAINTENANCE OFF)
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
