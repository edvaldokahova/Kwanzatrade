import { generateMarketIntelligence } from "./marketIntelligence";
import { fetchAlphaVantageData, type AlphaResult } from "@/lib/alphaVantageClient";
import {
  fetchGeminiAnalysis,
  fetchGeminiAISuggestion,
  type GeminiAnalysisResult,
} from "@/lib/geminiClient";
import { fetchMarketAuxData, type MarketAuxResult } from "@/lib/marketAuxClient";
import type { MarketContext } from "./marketAnalysis";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Bot24UserInput {
  pair: string;
  capital: number;
  timeframe: string;
  traderLevel: string;
  risk: number;
}

export interface Bot24SingleResult {
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
  profitPotential: string;
  score: string;
  reasoning: string;
  marketScore: number;
  trend: string;
  momentum: number;
  volatility: number;
  liquidity: number;
  probability: number;
}

export interface Bot24Result extends Bot24SingleResult {
  /** Sugestão premium da IA — usa dados de mercado ricos, sem restrições do utilizador */
  aiSuggestion: Bot24SingleResult;
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function buildContextInput(
  pair: string,
  alphaData: AlphaResult,
  marketAuxData: MarketAuxResult
) {
  const ctx: MarketContext | undefined = alphaData?.marketContext;
  const lastPrice = alphaData?.latestPrice ?? 1.085;

  return {
    pair,
    lastPrice,
    trend:           ctx?.trend          ?? "neutral",
    trendStrength:   ctx?.trendStrength  ?? "weak",
    support:         ctx?.support        ?? parseFloat((lastPrice * 0.995).toFixed(5)),
    resistance:      ctx?.resistance     ?? parseFloat((lastPrice * 1.005).toFixed(5)),
    volatility:      ctx?.volatility     ?? "medium",
    volatilityValue: ctx?.volatilityValue ?? 0.003,
    momentum:        ctx?.momentum       ?? 0,
    recentBehavior:  ctx?.recentBehavior ?? "insufficient data",
    activeSession:   ctx?.activeSession  ?? "Unknown",
    candles:         alphaData?.recentBars?.slice(0, 10) ?? [],
    newsSentiment:   marketAuxData?.sentiment,
    newsHeadlines:   marketAuxData?.headlines,
  };
}

function buildSingleResult(
  pair: string,
  gemini: GeminiAnalysisResult,
  capital: number,
  risk: number,
  fallbackTimeframe: string,
  marketAuxSummary: string
): Bot24SingleResult {
  const entry       = gemini.entry_price || 1.085;
  const rawSL       = gemini.stop_loss   || entry * 0.9985;
  const rawTP       = gemini.take_profit || entry * 1.003;
  const slDist      = Math.abs(entry - rawSL);
  const tpDist      = Math.abs(rawTP - entry);
  const riskAmount  = capital * (risk / 100);
  const posSize     = slDist > 0 ? riskAmount / slDist : 0;
  const rr          = slDist > 0 ? tpDist / slDist : 0;
  const profit      = riskAmount * Math.max(rr, 0);

  const intelligence = generateMarketIntelligence({
    signal: gemini.signal,
    confidence: Number(gemini.confidence) || 50,
  });

  return {
    pair,
    suggestedTimeframe: gemini.suggestedTimeframe || fallbackTimeframe,
    signal:             gemini.signal             || "NEUTRAL",
    confidence:         Number(gemini.confidence) || 50,
    tradingWindow:      gemini.tradingWindow      || "London / New York",
    riskSuggestion:     gemini.riskSuggestion     || "Use conservative risk management",
    marketAuxSummary,
    entry,
    stopLoss:       rawSL,
    takeProfit:     rawTP,
    riskReward:     isFinite(rr)      ? rr.toFixed(2)      : "0.00",
    positionSize:   isFinite(posSize) ? posSize.toFixed(2) : "0.00",
    profitPotential: isFinite(profit) ? profit.toFixed(2)  : "0.00",
    score:          gemini.score     || "5.0 / 10",
    reasoning:      gemini.reasoning || "",
    marketScore:    intelligence.marketScore,
    trend:          intelligence.trend,
    momentum:       intelligence.momentum,
    volatility:     intelligence.volatility,
    liquidity:      intelligence.liquidity,
    probability:    intelligence.probability,
  };
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Executa DUAS análises em paralelo usando UMA única request à Alpha Vantage (cache 1h).
 * 1. Análise do utilizador — respeita os parâmetros escolhidos
 * 2. Sugestão da IA — escolhe o setup ótimo com base nos dados de mercado
 */
export async function runBot24Analysis(
  userInput: Bot24UserInput
): Promise<Bot24Result> {
  const { pair, capital, timeframe, traderLevel, risk } = userInput;

  // ── 1. Fetch de dados (ambas as análises usam o mesmo cache) ─────────────
  const [alphaData, marketAuxData] = await Promise.all([
    fetchAlphaVantageData(pair),
    fetchMarketAuxData(pair),
  ]);

  const marketAuxSummary =
    marketAuxData?.summary ?? "Sem dados fundamentais recentes.";
  const contextInput = buildContextInput(pair, alphaData, marketAuxData);

  // ── 2. Duas análises Gemini em paralelo ───────────────────────────────────
  // Risco da IA: otimizado por nível do trader
  const aiRisk =
    traderLevel === "beginner"     ? 1 :
    traderLevel === "intermediate" ? 1.5 : 2;

  const [geminiUser, geminiAI] = await Promise.all([
    fetchGeminiAnalysis({
      ...contextInput,
      timeframe,
      capital,
      risk,
      traderLevel,
    }),
    fetchGeminiAISuggestion({
      ...contextInput,
      capital,
      traderLevel,
    }),
  ]);

  // ── 3. Compõe resultados ──────────────────────────────────────────────────
  const userAnalysis  = buildSingleResult(pair, geminiUser, capital, risk,   timeframe,                   marketAuxSummary);
  const aiSuggestion  = buildSingleResult(pair, geminiAI,   capital, aiRisk, geminiAI.suggestedTimeframe, marketAuxSummary);

  return { ...userAnalysis, aiSuggestion };
}

/**
 * Versão leve para o scheduler — usa dados já carregados, 1 Gemini call por timeframe.
 */
export async function runLiveSignalAnalysis(
  pair: string,
  timeframe: string,
  capital: number,
  traderLevel: string,
  alphaData: AlphaResult,
  marketAuxData: MarketAuxResult
): Promise<Bot24SingleResult> {
  const marketAuxSummary = marketAuxData?.summary ?? "";
  const contextInput     = buildContextInput(pair, alphaData, marketAuxData);

  const gemini = await fetchGeminiAnalysis({
    ...contextInput,
    timeframe,
    capital,
    risk: 1,
    traderLevel,
  });

  return buildSingleResult(pair, gemini, capital, 1, timeframe, marketAuxSummary);
  }
