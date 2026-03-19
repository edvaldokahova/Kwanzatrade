import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const tokenHash  = searchParams.get("token_hash");
  const type       = searchParams.get("type");
  const next       = searchParams.get("next") ?? "/dashboard";

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // ✅ Trata token_hash — usado por: confirmação de email, magic link, recovery
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });

    if (!error) {
      // Recovery (reset password) — redireciona para a página de nova senha
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/resetPassword`);
      }
      // Confirmação de email / magic link — vai para next (dashboard)
      return response;
    }

    console.error("Callback token_hash error:", error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=confirmation-failed`);
  }

  // ✅ Trata code — usado por: OAuth (Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error("Callback code error:", error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth-callback-failed`);
  }

  // Nenhum parâmetro válido
  return NextResponse.redirect(`${origin}/auth/login?error=missing-params`);
}
