import { NextRequest, NextResponse } from "next/server";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// ✅ CRÍTICO: sem isto, Vercel Hobby mata a função aos 10s
// Com este export, o Next.js sabe que a função pode demorar mais
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pair, capital, timeframe, traderLevel, risk } = body;

    if (!pair || !capital || !timeframe || !traderLevel || risk == null) {
      return NextResponse.json({ error: "Parâmetros em falta" }, { status: 400 });
    }

    // ✅ Verifica variáveis de ambiente antes de tentar
    const missingEnvs: string[] = [];
    if (!process.env.ALPHA_VANTAGE_KEY)  missingEnvs.push("ALPHA_VANTAGE_KEY");
    if (!process.env.GEMINI_API_KEY)     missingEnvs.push("GEMINI_API_KEY");
    if (!process.env.MARKETAUX_API_KEY)  missingEnvs.push("MARKETAUX_API_KEY");

    if (missingEnvs.length > 0) {
      console.error("❌ Variáveis de ambiente em falta:", missingEnvs);
      return NextResponse.json(
        {
          error: "Configuração incompleta",
          details: `Variáveis em falta: ${missingEnvs.join(", ")}`,
        },
        { status: 500 }
      );
    }

    console.log(`🔄 Análise iniciada: ${pair} | TF: ${timeframe} | Capital: $${capital}`);
    const startTime = Date.now();

    const result = await runBot24Analysis({
      pair:        String(pair),
      capital:     Number(capital),
      timeframe:   String(timeframe),
      traderLevel: String(traderLevel),
      risk:        Number(risk),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Análise concluída em ${duration}s — sinal: ${result.signal} (${result.confidence}%)`);

    // ✅ Deteta se o resultado é o fallback padrão e avisa nos logs
    if (result.signal === "NEUTRAL" && result.confidence === 50 && result.entry === 1.085) {
      console.warn("⚠️ ATENÇÃO: Resultado é o fallback padrão — alguma API falhou silenciosamente");
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Analyze API error:", error);
    return NextResponse.json(
      { error: "Falha na análise", details: error?.message },
      { status: 500 }
    );
  }
}
