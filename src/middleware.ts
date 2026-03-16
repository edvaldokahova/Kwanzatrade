import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Cria o Supabase client usando o server.ts (cookies centralizados)
  const supabase = await createClient();

  // Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Define se é página de login
  const isAuthPage = pathname.startsWith("/auth");

  // Define rotas protegidas
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bot24") ||
    pathname.startsWith("/live-signals") ||
    pathname.startsWith("/performance") ||
    pathname.startsWith("/my-account");

  // Se não estiver logado e tentar acessar rota protegida, redireciona para login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Se estiver logado e acessar página de login, redireciona para dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

// Configuração das rotas que o middleware deve observar
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
