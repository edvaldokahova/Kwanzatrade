import { supabase } from "@/lib/supabaseClient";

export async function saveBot24History(result: any) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;

  await supabase.from("bot24_history").insert({
    user_id: userData.user.id,
    pair: result.pair,
    timeframe: result.suggestedTimeframe,
    signal: result.signal,
    confidence: result.confidence,
    trading_window: result.tradingWindow,
    risk_suggestion: result.riskSuggestion,
    entry_price: parseFloat(result.entry) || 0,
    stop_loss: parseFloat(result.stopLoss) || 0,
    take_profit: parseFloat(result.takeProfit) || 0,
    risk_reward: parseFloat(result.riskReward) || 0,
    position_size: parseFloat(result.positionSize) || 0,
    market_score: result.marketScore,
    trend: result.trend,
    momentum: result.momentum,
    volatility: result.volatility,
    liquidity: result.liquidity,
    probability: result.probability
  });
}
