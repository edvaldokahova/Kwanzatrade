import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // Troca o código temporário do Google/Email por uma sessão real
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL para onde o utilizador vai após o sucesso
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
