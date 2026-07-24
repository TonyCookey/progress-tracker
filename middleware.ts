import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // If not logged in, redirect to login page
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If logged in, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", // main dashboard (all app pages live under here)
    "/auth/register", // leader registration (SUPERADMIN-only, enforced client + server side)
  ],
};
