import { generateMarketIntelligence } from "./marketIntelligence";
import { fetchAlphaVantageData } from "@/lib/alphaVantageClient";
import { fetchGeminiAnalysis } from "@/lib/geminiClient";
import { fetchMarketAuxData } from "@/lib/marketAuxClient";

export interface Bot24UserInput {
  pair: string;
  capital: number;
  timeframe: string;
  traderLevel: string;
  risk: number;
}

export interface Bot24Result {
  pair: string;
  suggestedTimeframe: string;
  signal: string;
  confidence: number;
  tradingWindow: string;
  riskSuggestion: string;
  marketAuxSummary: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  positionSize: string;
  score: string;
  marketScore: number;
  trend: string;
  momentum: number;
  volatility: number;
  liquidity: number;
  probability: number;
}

export async function runBot24Analysis(
  userInput: Bot24UserInput
): Promise<Bot24Result> {
  const { pair, capital, timeframe, traderLevel, risk } = userInput;

  // 1️⃣ Market data (cache de 60min, server-side)
  const alphaData = await fetchAlphaVantageData(pair);

  // 2️⃣ News / Sentiment (cache de 60min, server-side)
  const marketAuxData = await fetchMarketAuxData(pair);

  // 3️⃣ AI Analysis via Gemini (server-side, usa GEMINI_API_KEY)
  const geminiResult = await fetchGeminiAnalysis({
    pair,
    timeframe,
    traderLevel,
    latestPrice: alphaData?.latestPrice,
    recentBars: alphaData?.recentBars,
    newsSummary: marketAuxData?.summary,
    userInput: { capital, risk },
  });

  // ─── Risk calculations ────────────────────────────────────────
  const latestPrice = alphaData?.latestPrice ?? 1;
  const entryPrice = geminiResult.entry_price || latestPrice;
  const rawStopLoss = geminiResult.stop_loss || entryPrice * 0.99;
  const rawTakeProfit = geminiResult.take_profit || entryPrice * 1.02;

  const slDistance = Math.abs(entryPrice - rawStopLoss);
  const tpDistance = Math.abs(rawTakeProfit - entryPrice);

  const riskAmount = capital * (risk / 100);

  // ✅ Guards contra NaN/Infinity
  const positionSize = slDistance > 0 ? riskAmount / slDistance : 0;
  const riskReward = slDistance > 0 ? tpDistance / slDistance : 0;

  const result = {
    pair,
    suggestedTimeframe: geminiResult.suggestedTimeframe || timeframe,
    signal: geminiResult.signal || "NEUTRAL",
    confidence: Number(geminiResult.confidence) || 50,
    tradingWindow: geminiResult.tradingWindow || "London / New York",
    riskSuggestion:
      geminiResult.riskSuggestion || "Use conservative risk management",
    marketAuxSummary: marketAuxData?.summary || "Sem dados fundamentais recentes.",
    entry: entryPrice,
    stopLoss: rawStopLoss,
    takeProfit: rawTakeProfit,
    riskReward: isFinite(riskReward) ? riskReward.toFixed(2) : "0.00",
    positionSize: isFinite(positionSize) ? positionSize.toFixed(2) : "0.00",
    score: geminiResult.score || "5.0 / 10",
  };

  // 4️⃣ Market Intelligence
  const intelligence = generateMarketIntelligence({
    signal: result.signal,
    confidence: result.confidence,
  });

  return {
    ...result,
    marketScore: intelligence.marketScore,
    trend: intelligence.trend,
    momentum: intelligence.momentum,
    volatility: intelligence.volatility,
    liquidity: intelligence.liquidity,
    probability: intelligence.probability,
  };
}
