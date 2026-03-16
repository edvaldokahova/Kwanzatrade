import { createAdminClient } from "@/utils/supabase/admin";

type Bot24HistoryItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  momentum: number;
  volatility: number;
  probability: number;
  market_score: number;
  created_at: string;
};

/**
 * Server-side only — usa Admin Client para bypassar RLS.
 * Chamada por API routes (cron, run-quant).
 */
export async function runQuantEngine() {
  // ✅ Admin client — funciona em contexto server sem sessão de utilizador
  const supabase = createAdminClient();

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: history, error } = await supabase
      .from("bot24_history")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .returns<Bot24HistoryItem[]>();

    if (error || !history || history.length === 0) {
      console.log("ℹ️ QuantEngine: Sem dados históricos para processar.");
      return null;
    }

    // Limpar rankings anteriores
    await supabase
      .from("bot24_quant")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // ✅ Rankings calculados com top_volatility e top_momentum correctos
    const top10 = [...history]
      .sort(
        (a, b) =>
          b.market_score + b.confidence - (a.market_score + a.confidence)
      )
      .slice(0, 10);

    const highProb = [...history]
      .filter((h) => h.probability >= 80)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    const topVol = [...history]
      .sort((a, b) => b.volatility - a.volatility)
      .slice(0, 5);

    const topMomentum = [...history]
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 5);

    const top10Ids = new Set(top10.map((t) => t.id));
    const highProbIds = new Set(highProb.map((t) => t.id));
    const topVolIds = new Set(topVol.map((t) => t.id));
    const topMomentumIds = new Set(topMomentum.map((t) => t.id));

    const insertData = history.map((h) => ({
      history_id: h.id,
      pair: h.pair,
      top10: top10Ids.has(h.id),
      high_probability: highProbIds.has(h.id),
      top_volatility: topVolIds.has(h.id),
      top_momentum: topMomentumIds.has(h.id),
    }));

    if (insertData.length > 0) {
      const { error: insertError } = await supabase
        .from("bot24_quant")
        .insert(insertData);
      if (insertError) throw insertError;
    }

    return {
      processed: history.length,
      topTrades: top10.length,
      highProbability: highProb.length,
    };
  } catch (err) {
    console.error("❌ Erro crítico no QuantEngine:", err);
    return null;
  }
}
