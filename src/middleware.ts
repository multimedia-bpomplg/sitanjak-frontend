import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // ===============================
  // 🚫 PUBLIC ROUTES
  // ===============================
  if (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/core-gateway") ||
    path.startsWith("/maintenance") ||
    path.startsWith("/403") ||
    path.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // ===============================
  // 🔥 CEK MAINTENANCE
  // ===============================
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/maintenance/status`,
    );
    const data = await res.json();

    if (data.isActive) {
      const allowedPaths = [
        "/maintenance",
        "/auth/core-gateway",
        "/dashboard/superadmin",
      ];

      // Kalau path termasuk yang diizinkan
      if (allowedPaths.some((allowed) => path.startsWith(allowed))) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  } catch {}

  // ===============================
  // 🔐 AUTH PROTECTION
  // ===============================
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
