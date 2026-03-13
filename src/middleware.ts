import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {

  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  /* ROTAS PUBLICAS */

  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgotPassword",
    "/auth/resetPassword",
    "/auth/callback"
  ];

  const isPublic = publicRoutes.includes(path);

  /* SE NÃO ESTÁ LOGADO */

  if (!session && !isPublic) {

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";

    return NextResponse.redirect(redirectUrl);

  }

  /* SE JÁ ESTÁ LOGADO E TENTA IR PARA LOGIN */

  if (session && path.startsWith("/auth")) {

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";

    return NextResponse.redirect(redirectUrl);

  }

  return res;

}

export const config = {

  matcher: [

    /*
    protege toda a app
    exceto ficheiros internos
    */

    "/((?!_next/static|_next/image|favicon.ico).*)",

  ],

};
