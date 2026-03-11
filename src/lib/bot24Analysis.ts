// src/lib/bot24Analysis.ts

import { generateMarketIntelligence } from "./marketIntelligence";
import { fetchAlphaVantageData } from "@/lib/alphaVantageClient";
import { fetchGeminiAnalysis } from "@/lib/geminiClient";
import { fetchMarketAuxData } from "@/lib/marketAuxClient";

export async function runBot24Analysis(userInput: {
  pair: string;
  capital: number;
  timeframe: string;
  traderLevel: string;
  risk: number;
}) {

  const { pair, capital, timeframe, traderLevel, risk } = userInput;

  // 1️⃣ Market Data
  const alphaData = await fetchAlphaVantageData(pair);

  // 2️⃣ News / sentiment
  const marketAuxData = await fetchMarketAuxData(pair);

  // 3️⃣ AI Analysis
  const geminiInput = {
    alphaData,
    marketAuxData,
    userInput
  };

  const geminiResult = await fetchGeminiAnalysis(geminiInput);

  // =========================
  // Risk calculations
  // =========================

  const entryPrice =
    geminiResult.entry_price ||
    alphaData?.latestPrice ||
    1;

  const stopLoss =
    geminiResult.stop_loss ||
    entryPrice * 0.99;

  const takeProfit =
    geminiResult.take_profit ||
    entryPrice * 1.02;

  const riskAmount =
    capital * (risk / 100);

  const positionSize =
    riskAmount / Math.abs(entryPrice - stopLoss);

  const riskReward =
    Math.abs(takeProfit - entryPrice) /
    Math.abs(entryPrice - stopLoss);

  const result = {

    pair,

    suggestedTimeframe: geminiResult.suggestedTimeframe || timeframe,

    signal: geminiResult.signal || "Neutral",

    confidence: geminiResult.confidence || 50,

    tradingWindow:
      geminiResult.tradingWindow || "London / New York",

    riskSuggestion:
      geminiResult.riskSuggestion ||
      "Use conservative risk management",

    marketAuxSummary:
      marketAuxData?.summary || "Sem dados fundamentais recentes.",

    entry: entryPrice,

    stopLoss: stopLoss,

    takeProfit: takeProfit,

    riskReward: riskReward.toFixed(2),

    positionSize: positionSize.toFixed(2),

    score: geminiResult.score || "8.2 / 10"
  };

  // 4️⃣ Gerar Inteligência de Mercado baseada no sinal e confiança
  const intelligence = generateMarketIntelligence({
    signal: result.signal,
    confidence: result.confidence
  });

  // Retorno final com todos os campos mapeados individualmente
  return {
    ...result,
    marketScore: intelligence.marketScore,
    trend: intelligence.trend,
    momentum: intelligence.momentum,
    volatility: intelligence.volatility,
    liquidity: intelligence.liquidity,
    probability: intelligence.probability
  };
}