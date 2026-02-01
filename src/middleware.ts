import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    // ✅ DECODE TOKEN UNTUK DAPATKAN SEMUA INFORMASI
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = payload.roles || [];
    const isSuperAccess = payload.isSuperAccess || false;

    const path = req.nextUrl.pathname;

    console.log("🔍 Middleware Check:", {
      path,
      roles,
      isSuperAccess,
      userEmail: payload.email,
    });

    // ✅ SUPERADMIN ROUTES
    if (path.startsWith("/dashboard/superadmin")) {
      if (!roles.includes("superadmin")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // ✅ ADMIN ROUTES - PERBAIKAN DI SINI!
    if (path.startsWith("/dashboard/admin")) {
      // Admin biasa: boleh akses semua halaman admin
      if (roles.includes("admin")) {
        console.log("✅ Admin access granted");
        return NextResponse.next();
      }

      // Superadmin juga boleh akses admin routes
      if (roles.includes("superadmin")) {
        console.log("✅ Superadmin access to admin routes");
        return NextResponse.next();
      }

      // Jika bukan admin atau superadmin
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
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
