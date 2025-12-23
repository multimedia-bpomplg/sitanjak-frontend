import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const roles = req.cookies.get("roles")
    ? JSON.parse(req.cookies.get("roles")!.value)
    : [];

  const path = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (
    path.startsWith("/dashboard/superadmin") &&
    !roles.includes("superadmin")
  ) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (
    path.startsWith("/dashboard/admin") &&
    !roles.some((r: string) => ["admin", "superadmin"].includes(r))
  ) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (path.startsWith("/dashboard/mentor") && !roles.includes("mentor")) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (path.startsWith("/dashboard/peserta") && !roles.includes("peserta")) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
