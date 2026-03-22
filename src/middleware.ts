import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/utils/supabase/middleware";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createMiddlewareClient(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // ✅ Rotas de callback e reset nunca devem ser interceptadas
  // O Supabase precisa de processar o token antes de qualquer redirect
  const isAuthCallback = pathname === "/auth/callback";
  const isResetPassword = pathname === "/auth/resetPassword";

  const isAuthPage = pathname.startsWith("/auth");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bot24") ||
    pathname.startsWith("/live-signals") ||
    pathname.startsWith("/performance") ||
    pathname.startsWith("/sigma") ||
    pathname.startsWith("/my-account");

  // Rota protegida sem sessão — redireciona para login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // ✅ Utilizador autenticado em página de auth
  // MAS nunca redireciona callback nem reset — essas rotas processam tokens
  if (user && isAuthPage && !isAuthCallback && !isResetPassword) {
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
    "/sigma/:path*",
    "/auth/:path*",
  ],
};
