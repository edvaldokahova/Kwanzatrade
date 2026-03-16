import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          req.cookies.set(name, "");
          res.cookies.set(name, "", options);
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

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
