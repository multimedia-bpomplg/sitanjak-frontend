import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = payload.roles || [];

    const path = req.nextUrl.pathname;

    // ✅ SUPERADMIN ROUTES
    if (path.startsWith("/dashboard/superadmin")) {
      if (!roles.includes("superadmin")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // ✅ ADMIN ROUTES
    if (path.startsWith("/dashboard/admin")) {
      if (roles.includes("admin") || roles.includes("superadmin")) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/403", req.url));
    }

    // ✅ MENTOR ROUTES
    if (path.startsWith("/dashboard/mentor") && !roles.includes("mentor")) {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    // ✅ PESERTA ROUTES
    if (path.startsWith("/dashboard/peserta") && !roles.includes("peserta")) {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
