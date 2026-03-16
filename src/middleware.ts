import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/utils/supabase/middleware";

export async function middleware(req: NextRequest) {
  // ✅ response mutável — o middleware client pode atualizar cookies
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  // ✅ usa o client correto para middleware (não server.ts)
  const supabase = createMiddlewareClient(req, res);

  // Renova a sessão se expirada (não usar getSession — usa getUser para validar server-side)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bot24") ||
    pathname.startsWith("/live-signals") ||
    pathname.startsWith("/performance") ||
    pathname.startsWith("/my-account");

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bot24/:path*",
    "/live-signals/:path*",
    "/performance/:path*",
    "/my-account/:path*",
    "/auth/:path*",
  ],
};
