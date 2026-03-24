import { createAdminClient } from "@/utils/supabase/admin";
import type { Bot24SingleResult } from "./bot24Analysis";

export type { Bot24SingleResult as Bot24AnalysisResult };

/**
 * Salva análises no bot24_history (server-side, admin client).
 */
export async function saveBot24HistoryServer(
  result: Bot24SingleResult,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("bot24_history").insert({
      user_id:        userId ?? null,
      pair:           result.pair,
      timeframe:      result.suggestedTimeframe ?? "H1",
      signal:         result.signal,
      confidence:     Number(result.confidence)  || 0,
      trading_window: result.tradingWindow        ?? null,
      risk_suggestion:result.riskSuggestion       ?? null,
      entry_price:    parseFloat(String(result.entry))       || 0,
      stop_loss:      parseFloat(String(result.stopLoss))    || 0,
      take_profit:    parseFloat(String(result.takeProfit))  || 0,
      risk_reward:    parseFloat(String(result.riskReward))  || 0,
      position_size:  parseFloat(String(result.positionSize ?? 0)) || 0,
      market_score:   Number(result.marketScore) || 0,
      trend:          result.trend    ?? null,
      momentum:       Number(result.momentum)  || 0,
      volatility:     Number(result.volatility) || 0,
      liquidity:      Number(result.liquidity)  || 0,
      probability:    Number(result.probability) || 0,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    console.error("saveBot24HistoryServer error:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Salva sinal em live_signals (server-side, admin client).
 * Usado pelo scheduler para popular a páginas de Live Signals.
 */
export async function saveLiveSignal(
  result: Bot24SingleResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("live_signals").insert({
      pair:             result.pair,
      signal:           result.signal,
      confidence:       Number(result.confidence) || 0,
      timeframe:        result.suggestedTimeframe ?? "H1",
      trend:            result.trend              ?? null,
      market_session:   result.tradingWindow      ?? null,
      momentum:         Number(result.momentum)   || 0,
      created_at:       new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    console.error("saveLiveSignal error:", err);
    return { success: false, error: err?.message };
  }
}
