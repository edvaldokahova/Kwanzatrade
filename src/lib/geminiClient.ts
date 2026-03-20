/**
 * Server-side ONLY.
 * Modelo: gemini-2.5-flash
 * Framework: Soros Reflexivity — reagir ao comportamento, nao prever
 * Cache de respostas: TTL 15min por combinacao de parametros
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
  // Entry estrategico calculado a partir da estrutura de mercado
  const isBullish = input.trend === "bullish" || input.momentum > 0;

  // Distancia ao suporte/resistencia mais proximo
  const distToSupport    = Math.abs(input.lastPrice - input.support);
  const distToResistance = Math.abs(input.resistance - input.lastPrice);

  // Entry estrategico — perto do nivel mais proximo relevante
  const strategicEntry = isBullish
    ? parseFloat((input.lastPrice - distToSupport * 0.3).toFixed(5))    // pullback para suporte
    : parseFloat((input.lastPrice + distToResistance * 0.3).toFixed(5)); // bounce para resistencia

  const exampleSL = isBullish
    ? parseFloat((input.support - 0.0010).toFixed(5))   // abaixo do suporte
    : parseFloat((input.resistance + 0.0010).toFixed(5)); // acima da resistencia

  const exampleTP = isBullish
    ? parseFloat((input.resistance - 0.0005).toFixed(5)) // perto da resistencia
    : parseFloat((input.support + 0.0005).toFixed(5));   // perto do suporte

  const newsContext = input.newsHeadlines && input.newsHeadlines.length > 0
    ? `news_sentiment=${input.newsSentiment} | headlines: ${input.newsHeadlines.slice(0, 2).join(" | ")}`
    : `news_sentiment=${input.newsSentiment ?? "neutral"} | no recent headlines`;

  return [
    "You are a systematic institutional trader using Soros reflexivity framework.",
    "CORE PRINCIPLE: Markets are psychological. Find where the CROWD IS WRONG. React, do NOT predict.",
    "",
    "=== MARKET STRUCTURE ===",
    `current_price=${input.lastPrice}`,
    `trend=${input.trend}(${input.trendStrength})`,
    `key_support=${input.support}`,
    `key_resistance=${input.resistance}`,
    `volatility=${input.volatility}(avg_range=${input.volatilityValue})`,
    `momentum=${input.momentum > 0 ? "+" : ""}${input.momentum}%`,
    `market_behavior=${input.recentBehavior}`,
    `active_session=${input.activeSession}`,
    "",
    "=== FUNDAMENTAL CONTEXT ===",
    newsContext,
    "",
    "=== DAILY CANDLES (most recent first) ===",
    candlesToText(input.candles),
    "",
    "=== TRADER PROFILE ===",
    `level=${input.traderLevel} | timeframe=${input.timeframe} | capital=$${input.capital} | max_risk=${input.risk}%`,
    "",
    "=== SOROS DECISION RULES ===",
    "1. CONFLUENCE REQUIRED: trend + momentum + session must align. If they dont, signal=NEUTRAL.",
    "2. ENTRY must be at a STRUCTURAL LEVEL (near support for BUY, near resistance for SELL).",
    "   NEVER use current_price as entry. Find the strategic level.",
    "3. STOP LOSS must be BEYOND the structural level that invalidates the setup.",
    "   BUY setup invalidated: price closes below support. SL = support - buffer.",
    "   SELL setup invalidated: price closes above resistance. SL = resistance + buffer.",
    "4. TAKE PROFIT must target the NEXT structural level. Minimum R/R = 1:1.5.",
    "   If you cannot achieve 1:1.5 R/R, signal=NEUTRAL. Do not force bad trades.",
    "5. CONFIDENCE above 80 ONLY when: trend is strong + momentum confirms + news aligns.",
    "6. ALL prices must have exactly 5 decimal places.",
    "",
    "Respond with a single JSON object only. No markdown. No explanation.",
    `{"signal":"${isBullish ? "BUY" : "SELL"}","confidence":72,"entry_price":${strategicEntry},"stop_loss":${exampleSL},"take_profit":${exampleTP},"suggestedTimeframe":"${input.timeframe}","tradingWindow":"${input.activeSession}","riskSuggestion":"SL at structural invalidation level","score":"7.5 / 10","reasoning":"Confluence confirmed: trend+momentum+session aligned at key level"}`,
  ].join("\n");
}

function buildAIPrompt(input: AISuggestionInput): string {
  const isBullish = input.momentum > 0;

  const distToSupport    = Math.abs(input.lastPrice - input.support);
  const distToResistance = Math.abs(input.resistance - input.lastPrice);

  // IA escolhe o melhor setup — pode ser contrario ao momentum se houver reversao
  const strategicEntry = isBullish
    ? parseFloat((input.lastPrice - distToSupport * 0.25).toFixed(5))
    : parseFloat((input.lastPrice + distToResistance * 0.25).toFixed(5));

  const exampleSL = isBullish
    ? parseFloat((input.support - 0.0015).toFixed(5))
    : parseFloat((input.resistance + 0.0015).toFixed(5));

  const exampleTP = isBullish
    ? parseFloat((input.resistance - 0.0003).toFixed(5))
    : parseFloat((input.support + 0.0003).toFixed(5));

  const newsContext = input.newsHeadlines && input.newsHeadlines.length > 0
    ? `sentiment=${input.newsSentiment} | ${input.newsHeadlines.slice(0, 2).join(" | ")}`
    : `sentiment=${input.newsSentiment ?? "neutral"} | no recent news`;

  return [
    "You are George Soros analyzing EURUSD. You have 30 years of institutional Forex experience.",
    "You use reflexivity: markets are driven by PSYCHOLOGY and FEEDBACK LOOPS, not pure fundamentals.",
    "You REACT to market behavior. You NEVER predict. You find ASYMMETRIC opportunities.",
    "Your edge: identify where the crowd is wrong, enter with tight SL, ride the move.",
    "",
    "=== FULL MARKET CONTEXT ===",
    `current_price=${input.lastPrice}`,
    `trend=${input.trend}(${input.trendStrength})`,
    `support=${input.support} | resistance=${input.resistance}`,
    `volatility=${input.volatility}(pip_range=${input.volatilityValue})`,
    `momentum=${input.momentum > 0 ? "+" : ""}${input.momentum}%`,
    `behavior=${input.recentBehavior}`,
    `session=${input.activeSession}`,
    "",
    "=== NEWS & FUNDAMENTALS ===",
    newsContext,
    "",
    "=== PRICE HISTORY (daily candles) ===",
    candlesToText(input.candles),
    "",
    "=== INVESTOR PROFILE ===",
    `experience=${input.traderLevel} | capital=$${input.capital}`,
    "",
    "=== YOUR MANDATE ===",
    "1. Choose the OPTIMAL timeframe for current market conditions (M15/H1/H4/D1).",
    "2. Find the HIGHEST QUALITY asymmetric setup available right now.",
    "3. ENTRY: must be at a key structural level. NEVER use current_price as entry.",
    "   Price gravitates to structure. Enter where structure is, not where price is now.",
    "4. STOP LOSS: place BEYOND the level that invalidates your thesis.",
    "   Soros rule: if the market proves you wrong, GET OUT FAST.",
    "5. TAKE PROFIT: target the next major structural level for maximum asymmetry.",
    "   Soros rule: when right, STAY IN and let profits run.",
    "6. Minimum R/R = 1:1.5. If no setup meets this, signal=NEUTRAL.",
    "7. Confidence 80+ ONLY for genuine A+ setups with full confluence.",
    "8. ALL prices must have exactly 5 decimal places.",
    "",
    "Respond with a single JSON object only. No markdown. No explanation.",
    `{"signal":"${!isBullish ? "SELL" : "BUY"}","confidence":79,"entry_price":${strategicEntry},"stop_loss":${exampleSL},"take_profit":${exampleTP},"suggestedTimeframe":"H4","tradingWindow":"${input.activeSession}","riskSuggestion":"High conviction setup — structural entry with asymmetric R/R","score":"8.5 / 10","reasoning":"Price at key structural level with trend+momentum+news confluence"}`,
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
  const timeoutId  = setTimeout(() => controller.abort(), 25000);

  try {
    console.log(`Calling Gemini [${mode}] (Soros framework)...`);
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
            temperature:      0.15,   // ligeiramente mais alto para decisoes estrategicas
            maxOutputTokens:  2048,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0,
            },
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

  // Valida intervalo realista (0.5–5.0) E distancia maxima do entry (200 pips)
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

  const sl = extractPrice("stop_loss", entry) ??
    parseFloat((signal === "BUY" ? entry - 0.0030 : entry + 0.0030).toFixed(5));

  const tp = extractPrice("take_profit", entry) ??
    parseFloat((signal === "BUY" ? entry + 0.0060 : entry - 0.0060).toFixed(5));

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
    reasoning:          extractStr("reasoning") ?? "Analise baseada em estrutura de mercado",
  };

  console.log(`Fields extracted [${mode}]: ${recovered.signal} (${recovered.confidence}%) entry=${recovered.entry_price} sl=${recovered.stop_loss} tp=${recovered.take_profit}`);
  return recovered;
}

function normalizeResult(
  parsed: any,
  latestPrice: number,
  fallbackTimeframe: string
): GeminiAnalysisResult {
  const entry  = parseFloat(String(parsed.entry_price)) || latestPrice;
  const signal: string = parsed.signal ?? "NEUTRAL";

  const rawSL  = parseFloat(String(parsed.stop_loss));
  const rawTP  = parseFloat(String(parsed.take_profit));

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
    riskSuggestion:     "Sem confluencia — aguardar sinal mais claro",
    score:              "5.0 / 10",
    reasoning:          "Dados insuficientes para analise de qualidade",
  };
}
