/**
 * Server-side ONLY.
 * Modelo: gemini-2.5-flash
 * Cache de respostas: TTL 15min por combinação de parâmetros
 */

import type { Candle } from "./marketAnalysis";

// ─── Cache ────────────────────────────────────────────────────────────────────

type CacheEntry = { result: GeminiAnalysisResult; timestamp: number };
const responseCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 15 * 60 * 1000;

function capitalBucket(capital: number): string {
  return String(Math.floor(capital / 500) * 500);
}
function riskBucket(risk: number): string {
  return (Math.round(risk * 2) / 2).toFixed(1);
}
function buildCacheKey(
  mode: string, pair: string, timeframe: string,
  traderLevel: string, capital: number, risk: number
): string {
  return [mode, pair, timeframe, traderLevel, capitalBucket(capital), riskBucket(risk)].join("|");
}
function getCached(key: string): GeminiAnalysisResult | null {
  const entry = responseCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { delete responseCache[key]; return null; }
  return entry.result;
}
function setCache(key: string, result: GeminiAnalysisResult): void {
  responseCache[key] = { result, timestamp: Date.now() };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MarketContextInput {
  pair: string;
  lastPrice: number;
  trend: string;
  trendStrength: string;
  support: number;
  resistance: number;
  volatility: string;
  volatilityValue: number;
  momentum: number;
  recentBehavior: string;
  activeSession: string;
  candles: Candle[];
  newsSentiment?: string;
  newsHeadlines?: string[];
}

export interface UserAnalysisInput extends MarketContextInput {
  timeframe: string;
  capital: number;
  risk: number;
  traderLevel: string;
}

export interface AISuggestionInput extends MarketContextInput {
  capital: number;
  traderLevel: string;
}

export interface GeminiAnalysisResult {
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  suggestedTimeframe: string;
  tradingWindow: string;
  riskSuggestion: string;
  score: string;
  reasoning: string;
}

// ─── Funcoes publicas ─────────────────────────────────────────────────────────

export async function fetchGeminiAnalysis(
  input: UserAnalysisInput
): Promise<GeminiAnalysisResult> {
  const cacheKey = buildCacheKey("user", input.pair, input.timeframe, input.traderLevel, input.capital, input.risk);
  const cached = getCached(cacheKey);
  if (cached) { console.log("Cache hit user_analysis"); return cached; }
  const result = await callGemini(buildUserPrompt(input), input.lastPrice, "user_analysis", input.timeframe);
  setCache(cacheKey, result);
  return result;
}

export async function fetchGeminiAISuggestion(
  input: AISuggestionInput
): Promise<GeminiAnalysisResult> {
  const cacheKey = buildCacheKey("ai", input.pair, "auto", input.traderLevel, input.capital, 2);
  const cached = getCached(cacheKey);
  if (cached) { console.log("Cache hit ai_suggestion"); return cached; }
  const result = await callGemini(buildAIPrompt(input), input.lastPrice, "ai_suggestion", "H1");
  setCache(cacheKey, result);
  return result;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function candlesToText(candles: Candle[]): string {
  if (!candles || candles.length === 0) return "N/A";
  return candles.slice(0, 10).map(
    (c) => `${c.time} O:${c.open} H:${c.high} L:${c.low} C:${c.close}`
  ).join("\n");
}

function buildUserPrompt(input: UserAnalysisInput): string {
  return [
    "Analyze EURUSD and respond with a single JSON object only. No markdown. No explanation.",
    "",
    `price=${input.lastPrice}`,
    `trend=${input.trend}(${input.trendStrength})`,
    `support=${input.support}`,
    `resistance=${input.resistance}`,
    `volatility=${input.volatility}`,
    `momentum=${input.momentum}%`,
    `pattern=${input.recentBehavior}`,
    `session=${input.activeSession}`,
    `traderLevel=${input.traderLevel}`,
    `timeframe=${input.timeframe}`,
    `capital=${input.capital}`,
    `risk=${input.risk}%`,
    `news_sentiment=${input.newsSentiment ?? "neutral"}`,
    "",
    "Candles 60min:",
    candlesToText(input.candles),
    "",
    "Return this exact JSON structure with real values:",
    `{"signal":"BUY","confidence":72,"entry_price":${input.lastPrice},"stop_loss":${(input.lastPrice * 0.998).toFixed(5)},"take_profit":${(input.lastPrice * 1.004).toFixed(5)},"suggestedTimeframe":"${input.timeframe}","tradingWindow":"London+NY","riskSuggestion":"Use 2% risk per trade","score":"7.5 / 10","reasoning":"Bullish trend confirmed at support"}`,
  ].join("\n");
}

function buildAIPrompt(input: AISuggestionInput): string {
  return [
    "You are a hedge fund manager. Analyze EURUSD and respond with a single JSON object only. No markdown. No explanation.",
    "",
    `price=${input.lastPrice}`,
    `trend=${input.trend}(${input.trendStrength})`,
    `support=${input.support}`,
    `resistance=${input.resistance}`,
    `volatility=${input.volatility}`,
    `momentum=${input.momentum}%`,
    `pattern=${input.recentBehavior}`,
    `session=${input.activeSession}`,
    `traderLevel=${input.traderLevel}`,
    `capital=${input.capital}`,
    `news_sentiment=${input.newsSentiment ?? "neutral"}`,
    "",
    "Candles 60min:",
    candlesToText(input.candles),
    "",
    "Choose the optimal timeframe. Return this exact JSON structure with real values:",
    `{"signal":"SELL","confidence":78,"entry_price":${input.lastPrice},"stop_loss":${(input.lastPrice * 1.004).toFixed(5)},"take_profit":${(input.lastPrice * 0.994).toFixed(5)},"suggestedTimeframe":"H4","tradingWindow":"New York","riskSuggestion":"1.5% risk recommended","score":"8.0 / 10","reasoning":"Resistance rejection with bearish momentum"}`,
  ].join("\n");
}

// ─── Core Gemini call ─────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";

async function callGemini(
  prompt: string,
  latestPrice?: number,
  mode: string = "unknown",
  fallbackTimeframe: string = "H1"
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not defined");
    return getDefaultResponse(latestPrice, fallbackTimeframe);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    console.log(`Calling Gemini [${mode}]...`);
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini HTTP ${response.status} [${mode}]:`, errorBody.slice(0, 400));
      return getDefaultResponse(latestPrice, fallbackTimeframe);
    }

    const result = await response.json();
    const text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      console.error(`Gemini empty response [${mode}]:`, JSON.stringify(result).slice(0, 400));
      return getDefaultResponse(latestPrice, fallbackTimeframe);
    }

    console.log(`Gemini [${mode}] responded in ${duration}s (${text.length} chars)`);
    return robustParse(text, latestPrice, fallbackTimeframe, mode);

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      console.error(`Gemini TIMEOUT [${mode}]`);
    } else {
      console.error(`Gemini error [${mode}]:`, error?.message);
    }
    return getDefaultResponse(latestPrice, fallbackTimeframe);
  }
}

// ─── Parser robusto ───────────────────────────────────────────────────────────

function robustParse(
  text: string,
  latestPrice?: number,
  fallbackTimeframe: string = "H1",
  mode: string = "unknown"
): GeminiAnalysisResult {
  const price = latestPrice ?? 1.085;

  // 1. Parse directo
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed.signal && parsed.entry_price) {
      console.log(`Parse OK [${mode}]: ${parsed.signal} (${parsed.confidence}%)`);
      return normalizeResult(parsed, price, fallbackTimeframe);
    }
  } catch (_) {}

  // 2. Remove markdown e tenta de novo
  const stripped = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (parsed.signal && parsed.entry_price) {
      console.log(`Parse after strip [${mode}]: ${parsed.signal} (${parsed.confidence}%)`);
      return normalizeResult(parsed, price, fallbackTimeframe);
    }
  } catch (_) {}

  // 3. Extracao campo a campo — resiliente a JSON truncado
  console.warn(`Extracting fields individually [${mode}]`);

  function extractStr(key: string): string | undefined {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "i"));
    return m ? m[1] : undefined;
  }

  // ✅ Extrai preco, valida intervalo realista (0.5–5.0)
  // E valida distancia maxima do entry (200 pips = 0.0200 para EURUSD)
  // Rejeita valores truncados como "1.1" que causavam SL de 490 pips
  function extractPrice(key: string, entryRef?: number): number | undefined {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*([0-9]+\\.?[0-9]*)`, "i"));
    if (!m) return undefined;
    const val = parseFloat(m[1]);
    if (val < 0.5 || val > 5.0) return undefined;
    if (entryRef && Math.abs(val - entryRef) > 0.0200) return undefined;
    return parseFloat(val.toFixed(5));
  }

  function extractNum(key: string): number | undefined {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*([0-9]+\\.?[0-9]*)`, "i"));
    return m ? parseFloat(m[1]) : undefined;
  }

  const rawSignal = extractStr("signal") ?? "NEUTRAL";
  const signal: GeminiAnalysisResult["signal"] =
    rawSignal === "BUY" || rawSignal === "SELL" ? rawSignal : "NEUTRAL";

  const entry = extractPrice("entry_price") ?? price;

  // ✅ SL e TP validados com distancia maxima de 200 pips do entry
  // Fallback calculado com base no sinal se valor for invalido
  const sl = extractPrice("stop_loss", entry) ??
    parseFloat((signal === "BUY"
      ? entry - 0.0030
      : entry + 0.0030
    ).toFixed(5));

  const tp = extractPrice("take_profit", entry) ??
    parseFloat((signal === "BUY"
      ? entry + 0.0060
      : entry - 0.0060
    ).toFixed(5));

  const recovered: GeminiAnalysisResult = {
    signal,
    confidence:         Math.min(94, Math.max(50, extractNum("confidence") ?? 55)),
    entry_price:        entry,
    stop_loss:          sl,
    take_profit:        tp,
    suggestedTimeframe: extractStr("suggestedTimeframe") ?? fallbackTimeframe,
    tradingWindow:      extractStr("tradingWindow") ?? "London / New York",
    riskSuggestion:     extractStr("riskSuggestion") ?? "Use gestao de risco conservadora",
    score:              extractStr("score") ?? "6.0 / 10",
    reasoning:          extractStr("reasoning") ?? "Analise baseada em dados tecnicos",
  };

  console.log(`Fields extracted [${mode}]: ${recovered.signal} (${recovered.confidence}%) entry=${recovered.entry_price} sl=${recovered.stop_loss} tp=${recovered.take_profit}`);
  return recovered;
}

function normalizeResult(
  parsed: any,
  latestPrice: number,
  fallbackTimeframe: string
): GeminiAnalysisResult {
  const entry = parseFloat(String(parsed.entry_price)) || latestPrice;
  const signal: string = parsed.signal ?? "NEUTRAL";

  const rawSL = parseFloat(String(parsed.stop_loss));
  const rawTP = parseFloat(String(parsed.take_profit));

  // ✅ Valida SL e TP — rejeita valores fora do intervalo realista
  // OU demasiado longe do entry (mais de 200 pips = 0.0200)
  const slValid = rawSL >= 0.5 && rawSL <= 5.0 && Math.abs(rawSL - entry) <= 0.0200;
  const tpValid = rawTP >= 0.5 && rawTP <= 5.0 && Math.abs(rawTP - entry) <= 0.0200;

  const sl = slValid
    ? parseFloat(rawSL.toFixed(5))
    : parseFloat((signal === "BUY" ? entry - 0.0030 : entry + 0.0030).toFixed(5));

  const tp = tpValid
    ? parseFloat(rawTP.toFixed(5))
    : parseFloat((signal === "BUY" ? entry + 0.0060 : entry - 0.0060).toFixed(5));

  return {
    signal:             parsed.signal ?? "NEUTRAL",
    confidence:         Number(parsed.confidence) || 55,
    entry_price:        parseFloat(entry.toFixed(5)),
    stop_loss:          sl,
    take_profit:        tp,
    suggestedTimeframe: parsed.suggestedTimeframe ?? fallbackTimeframe,
    tradingWindow:      parsed.tradingWindow      ?? "London / New York",
    riskSuggestion:     parsed.riskSuggestion     ?? "Use gestao de risco conservadora",
    score:              parsed.score              ?? "6.0 / 10",
    reasoning:          parsed.reasoning          ?? "",
  };
}

function getDefaultResponse(
  latestPrice?: number,
  fallbackTimeframe: string = "H1"
): GeminiAnalysisResult {
  const price = latestPrice ?? 1.085;
  return {
    signal:             "NEUTRAL",
    confidence:         50,
    entry_price:        parseFloat(price.toFixed(5)),
    stop_loss:          parseFloat((price * 0.9985).toFixed(5)),
    take_profit:        parseFloat((price * 1.003).toFixed(5)),
    suggestedTimeframe: fallbackTimeframe,
    tradingWindow:      "Aguardar confirmacao de sessao",
    riskSuggestion:     "Aguardar sinal mais claro antes de entrar",
    score:              "5.0 / 10",
    reasoning:          "Dados insuficientes para analise precisa",
  };
}
