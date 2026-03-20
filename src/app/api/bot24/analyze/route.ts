import { NextRequest, NextResponse } from "next/server";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic    = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pair, capital, timeframe, traderLevel, risk } = body;

    if (!pair || !capital || !timeframe || !traderLevel || risk == null) {
      return NextResponse.json({ error: "Parametros em falta" }, { status: 400 });
    }

    // ── Validacao de variaveis de ambiente ────────────────────────────────
    const missingEnvs: string[] = [];
    if (!process.env.ALPHA_VANTAGE_KEY)  missingEnvs.push("ALPHA_VANTAGE_KEY");
    if (!process.env.GEMINI_API_KEY)     missingEnvs.push("GEMINI_API_KEY");
    if (!process.env.MARKETAUX_API_KEY)  missingEnvs.push("MARKETAUX_API_KEY");

    if (missingEnvs.length > 0) {
      console.error("Variaveis em falta:", missingEnvs);
      return NextResponse.json(
        { error: "Configuracao incompleta", details: `Em falta: ${missingEnvs.join(", ")}` },
        { status: 500 }
      );
    }

    console.log(`Analise iniciada: ${pair} | TF: ${timeframe} | Capital: $${capital}`);
    const startTime = Date.now();

    const result = await runBot24Analysis({
      pair:        String(pair),
      capital:     Number(capital),
      timeframe:   String(timeframe),
      traderLevel: String(traderLevel),
      risk:        Number(risk),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Analise concluida em ${duration}s — sinal: ${result.signal} (${result.confidence}%)`);

    if (result.signal === "NEUTRAL" && result.confidence === 50 && result.entry === 1.085) {
      console.warn("ATENCAO: Resultado e o fallback padrao — alguma API falhou silenciosamente");
    }

    // ── ✅ Guarda em live_signals para popular Heatmap e Live Signals ─────
    // Usa admin client para bypass RLS — operacao server-side
    try {
      const admin = createAdminClient();

      await admin.from("live_signals").insert({
        pair:           String(pair),
        signal:         result.signal,
        confidence:     result.confidence,
        timeframe:      String(timeframe),
        trend:          result.trend ?? null,
        market_session: result.tradingWindow ?? null,
        momentum:       result.momentum ?? null,
        support:        result.stopLoss   ?? null,   // melhor aproximacao disponivel
        resistance:     result.takeProfit ?? null,
        created_at:     new Date().toISOString(),
      });

      console.log(`Live signal guardado: ${pair} ${result.signal} ${timeframe}`);
    } catch (lsErr) {
      // Nao bloqueia a resposta ao utilizador se live_signals falhar
      console.warn("Live signal nao guardado (nao critico):", lsErr);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Falha na analise", details: error?.message },
      { status: 500 }
    );
  }
}
