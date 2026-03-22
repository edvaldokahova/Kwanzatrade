import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@/utils/supabase/server";
import { createAdminClient }         from "@/utils/supabase/admin";
import { runSigmaAnalysis }          from "@/lib/sigmaAnalysis";

export const dynamic     = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pair, capital, leverage, risk, traderLevel } = body;

    if (!pair || !capital || !leverage || risk == null || !traderLevel) {
      return NextResponse.json({ error: "Parametros em falta" }, { status: 400 });
    }

    if (!["BTCUSDT", "ETHUSDT"].includes(pair)) {
      return NextResponse.json({ error: "Par invalido — use BTCUSDT ou ETHUSDT" }, { status: 400 });
    }

    console.log(`SIGMA API: ${pair} | Capital: $${capital} | Leverage: ${leverage}x`);
    const startTime = Date.now();

    const result = await runSigmaAnalysis({
      pair:        String(pair),
      capital:     Number(capital),
      leverage:    Number(leverage),
      risk:        Number(risk),
      traderLevel: String(traderLevel),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ SIGMA concluido em ${duration}s — ${result.signal} (${result.confidence}%)`);

    // Guarda historico
    try {
      const admin = createAdminClient();
      await admin.from("sigma_history").insert({
        user_id:       user.id,
        pair:          result.pair,
        signal:        result.signal,
        confidence:    result.confidence,
        timeframe:     "H4",
        entry_price:   result.entry,
        stop_loss:     result.stopLoss,
        take_profit:   result.takeProfit,
        leverage:      result.leverage,
        liquidation:   result.liquidation,
        margin:        result.margin,
        position_size: parseFloat(result.positionSize),
        risk_reward:   result.riskReward,
        funding_rate:  parseFloat(result.fundingRate) || null,
        fear_greed:    result.fearGreed,
        reasoning:     result.reasoning,
        score:         result.score,
      });
    } catch (histErr) {
      console.warn("Sigma history nao guardado:", histErr);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("SIGMA API error:", error);
    return NextResponse.json(
      { error: "Falha na analise", details: error?.message },
      { status: 500 }
    );
  }
}
