import { createClient } from "@/utils/supabase/client";

export interface Bot24AnalysisResult {
  pair: string;
  suggestedTimeframe?: string;
  signal: string;
  confidence: number;
  tradingWindow?: string;
  riskSuggestion?: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string | number;
  positionSize?: string | number;
  marketScore?: number;
  trend?: string;
  momentum?: number | string;
  volatility?: number | string;
  liquidity?: number | string;
  probability?: number;
}

/**
 * Client-side: salva o histórico para o utilizador autenticado na sessão atual.
 */
export async function saveBot24History(
  result: Bot24AnalysisResult
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Utilizador não autenticado" };
    }

    const { error } = await supabase.from("bot24_history").insert({
      user_id: user.id,
      pair: result.pair,
      timeframe: result.suggestedTimeframe ?? "H1",
      signal: result.signal,
      confidence: Number(result.confidence) || 0,
      trading_window: result.tradingWindow ?? null,
      risk_suggestion: result.riskSuggestion ?? null,
      entry_price: parseFloat(String(result.entry)) || 0,
      stop_loss: parseFloat(String(result.stopLoss)) || 0,
      take_profit: parseFloat(String(result.takeProfit)) || 0,
      risk_reward: parseFloat(String(result.riskReward)) || 0,
      position_size: parseFloat(String(result.positionSize ?? 0)) || 0,
      market_score: Number(result.marketScore) || 0,
      trend: result.trend ?? null,
      momentum: Number(result.momentum) || 0,
      volatility: Number(result.volatility) || 0,
      liquidity: Number(result.liquidity) || 0,
      probability: Number(result.probability) || 0,
    });

    if (error) {
      console.error("saveBot24History error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("saveBot24History exception:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
