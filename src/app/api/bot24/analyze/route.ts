import { NextRequest, NextResponse } from "next/server";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // ✅ Verifica autenticação server-side
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

    // ✅ Análise completa server-side — chaves API nunca expostas ao cliente
    const result = await runBot24Analysis({
      pair:        String(pair),
      capital:     Number(capital),
      timeframe:   String(timeframe),
      traderLevel: String(traderLevel),
      risk:        Number(risk),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Analyze API error:", error);
    return NextResponse.json(
      { error: "Falha na análise", details: error?.message },
      { status: 500 }
    );
  }
}
