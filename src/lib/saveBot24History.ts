import { supabase } from "@/lib/supabaseClient";

export async function saveBot24History(result: any) {

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) return;

    await supabase
.from("bot24_history")
.insert({

user_id: user.id,

pair: result.pair,
timeframe: result.suggestedTimeframe,
signal: result.signal,
confidence: result.confidence,

trading_window: result.tradingWindow,
risk_suggestion: result.riskSuggestion,

entry_price: result.entry,
stop_loss: result.stopLoss,
take_profit: result.takeProfit,
risk_reward: result.riskReward,
position_size: result.positionSize,

market_score: result.marketScore,
trend: result.trend,
momentum: result.momentum,
volatility: result.volatility,
liquidity: result.liquidity,
probability: result.probability

});

}