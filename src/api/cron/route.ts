import { NextResponse } from 'next/server';
import { runGeminiScheduler } from '@/lib/geminiScheduler';

export async function GET(request: Request) {
  // Verificação de segurança para a Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Não autorizado', { status: 401 });
  }

  try {
    // Chama o teu robô que analisa os 7 pares
    await runGeminiScheduler();
    
    return NextResponse.json({ success: true, message: 'Cron executado!' });
  } catch (error) {
    console.error("Erro no Cron:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
