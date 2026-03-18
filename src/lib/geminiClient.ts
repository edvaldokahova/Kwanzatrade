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

// ─── Funções públicas ─────────────────────────────────────────────────────────

export async function fetchGeminiAnalysis(
  input: UserAnalysisInput
): Promise<GeminiAnalysisResult> {
  const cacheKey = buildCacheKey("user", input.pair, input.timeframe, input.traderLevel, input.capital, input.risk);
  const cached = getCached(cacheKey);
  if (cached) { console.log(`📦 [user_analysis] Cache hit`); return cached; }
  const result = await callGemini(buildUserPrompt(input), input.lastPrice, "user_analysis", input.timeframe);
  setCache(cacheKey, result);
  return result;
}

export async function fetchGeminiAISuggestion(
  input: AISuggestionInput
): Promise<GeminiAnalysisResult> {
  const cacheKey = buildCacheKey("ai", input.pair, "auto", input.traderLevel, input.capital, 2);
  const cached = getCached(cacheKey);
  if (cached) { console.log(`📦 [ai_suggestion] Cache hit`); return cached; }
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
  return `Trader quant institucional. Analise EURUSD e responda em JSON.

Dados: preco=${input.lastPrice} tendencia=${input.trend}(${input.trendStrength}) suporte=${input.support} resistencia=${input.resistance} volatilidade=${input.volatility} momentum=${input.momentum}% padrao="${input.recentBehavior}" sessao="${input.activeSession}"

Candles 60min:
${candlesToText(input.candles)}

Sentimento: ${input.newsSentiment ?? "neutral"}
Trader: nivel=${input.traderLevel} timeframe=${input.timeframe} capital=$${input.capital} risco=${input.risk}%

JSON obrigatorio (sem markdown, sem texto extra, apenas o objeto):
{"signal":"BUY","confidence":72,"entry_price":1.08450,"stop_loss":1.07980,"take_profit":1.09200,"suggestedTimeframe":"${input.timeframe}","tradingWindow":"London+NY","riskSuggestion":"Risco controlado","score":"7.5 / 10","reasoning":"Tendencia bullish com suporte confirmado"}

Substitua os valores do exemplo pela sua analise real. Responda APENAS com o JSON, sem mais nada.`.trim();
}

function buildAIPrompt(input: AISuggestionInput): string {
  return `Gestor hedge fund 30 anos Forex. Analise EURUSD e responda em JSON.

Dados: preco=${input.lastPrice} tendencia=${input.trend}(${input.trendStrength}) suporte=${input.support} resistencia=${input.resistance} volatilidade=${input.volatility} momentum=${input.momentum}% padrao="${input.recentBehavior}" sessao="${input.activeSession}"

Candles 60min:
${candlesToText(input.candles)}

Sentimento: ${input.newsSentiment ?? "neutral"}
Trader: nivel=${input.traderLevel} capital=$${input.capital}

JSON obrigatorio (sem markdown, sem texto extra, apenas o objeto):
{"signal":"SELL","confidence":78,"entry_price":1.08450,"stop_loss":1.08900,"take_profit":1.07700,"suggestedTimeframe":"H4","tradingWindow":"New York","riskSuggestion":"1.5% do capital","score":"8.0 / 10","reasoning":"Resistencia rejeitada com momentum bearish"}

Substitua os valores do exemplo pela sua analise real. Responda APENAS com o JSON, sem mais nada.`.trim();
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
    console.error(`❌ [${mode}] GEMINI_API_KEY não definida`);
    return getDefaultResponse(latestPrice, fallbackTimeframe);
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 25_000);

  try {
    console.log(`🤖 [${mode}] Chamando Gemini (${GEMINI_MODEL})...`);
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:      0.1,
            maxOutputTokens:  1024,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [${mode}] Gemini HTTP ${response.status}:`, errorBody.slice(0, 400));
      return getDefaultResponse(latestPrice, fallbackTimeframe);
    }

    const result = await response.json();
    const text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      console.error(`❌ [${mode}] Resposta vazia do Gemini`);
      return getDefaultResponse(latestPrice, fallbackTimeframe);
    }

    console.log(`✅ [${mode}] Gemini respondeu em ${duration}s (${text.length} chars)`);

    // ✅ Parser robusto — recupera campos mesmo de JSON truncado
    return robustParse(text, latestPrice, fallbackTimeframe, mode);

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      console.error(`❌ [${mode}] TIMEOUT após 25s`);
    } else {
      console.error(`❌ [${mode}] Erro:`, error?.message);
    }
    return getDefaultResponse(latestPrice, fallbackTimeframe);
  }
}

// ─── Parser robusto ───────────────────────────────────────────────────────────

/**
 * Extrai campos individualmente com regex.
 * Funciona mesmo com JSON truncado — os campos críticos (signal, confidence,
 * entry_price, stop_loss, take_profit) vêm sempre primeiro no prompt.
 */
function robustParse(
  text: string,
  latestPrice?: number,
  fallbackTimeframe: string = "H1",
  mode: string = "unknown"
): GeminiAnalysisResult {
  const price = latestPrice ?? 1.085;

  // 1. Tenta parse directo (JSON completo)
  const cleanText = text.trim();
  try {
    const parsed = JSON.parse(cleanText);
    if (parsed.signal && parsed.entry_price) {
      console.log(`✅ [${mode}] Parse directo OK — ${parsed.signal} (${parsed.confidence}%)`);
      return normalizeResult(parsed, price, fallbackTimeframe);
    }
  } catch {}

  // 2. Tenta remover markdown e fazer parse
  const stripped = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (parsed.signal && parsed.entry_price) {
      console.log(`✅ [${mode}] Parse após strip markdown OK`);
      return normalizeResult(parsed, price, fallbackTimeframe);
    }
  } catch {}

  // 3. ✅ Extracção campo a campo com regex (resiliente a truncagem)
  console.warn(`⚠️ [${mode}] JSON incompleto — extraindo campos individualmente`);

  const extractStr = (key: string): string | undefined => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "i"));
    return m?.[1];
  };
  const extractNum = (key: string): number | undefined => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*([0-9]+\\.?[0-9]*)`, "i"));
    return m ? parseFloat(m[1]) : undefined;
  };

  const signal    = (extractStr("signal") ?? "NEUTRAL") as GeminiAnalysisResult["signal"];
  const confidence = extractNum("confidence") ?? 55;
  const entry      = extractNum("entry_price") ?? price;
  const sl         = extractNum("stop_loss") ?? parseFloat((price * 0.9985).toFixed(5));
  const tp         = extractNum("take_profit") ?? parseFloat((price * 1.003).toFixed(5));
  const tf         = extractStr("suggestedTimeframe") ?? fallbackTimeframe;
  const window_    = extractStr("tradingWindow") ?? "London / New York";
  const riskSug    = extractStr("riskSuggestion") ?? "Use gestão de risco conservadora";
  const score      = extractStr("score") ?? "6.0 / 10";
  const reasoning  = extractStr("reasoning") ?? "Análise baseada em dados técnicos";

  // Valida sinal
  const validSignal = ["BUY", "SELL", "NEUTRAL"].includes(signal) ? signal : "NEUTRAL";

  const recovered: GeminiAnalysisResult = {
    signal:             validSignal,
    confidence:         Math.min(94, Math.max(50, confidence)),
    entry_price:        entry,
    stop_loss:          sl,
    take_profit:        tp,
    suggestedTimeframe: tf,
    tradingWindow:      window_,
    riskSuggestion:     riskSug,
    score,
    reasoning,
  };

  console.log(`✅ [${mode}] Campos extraídos — ${recovered.signal} (${recovered.confidence}%)`);
  return recovered;
}

function normalizeResult(
  parsed: any,
  latestPrice: number,
  fallbackTimeframe: string
): GeminiAnalysisResult {
  const entry = parseFloat(String(parsed.entry_price)) || latestPrice;
  const sl    = parseFloat(String(parsed.stop_loss))   || parseFloat((latestPrice * 0.9985).toFixed(5));
  const tp    = parseFloat(String(parsed.take_profit)) || parseFloat((latestPrice * 1.003).toFixed(5));

  return {
    signal:             parsed.signal ?? "NEUTRAL",
    confidence:         Number(parsed.confidence) || 55,
    entry_price:        entry,
    stop_loss:          sl,
    take_profit:        tp,
    suggestedTimeframe: parsed.suggestedTimeframe ?? fallbackTimeframe,
    tradingWindow:      parsed.tradingWindow      ?? "London / New York",
    riskSuggestion:     parsed.riskSuggestion     ?? "Use gestão de risco conservadora",
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
    entry_price:        price,
    stop_loss:          parseFloat((price * 0.9985).toFixed(5)),
    take_profit:        parseFloat((price * 1.003).toFixed(5)),
    suggestedTimeframe: fallbackTimeframe,
    tradingWindow:      "Aguardar confirmação de sessão",
    riskSuggestion:     "Aguardar sinal mais claro antes de entrar",
    score:              "5.0 / 10",
    reasoning:          "Dados insuficientes para análise precisa",
  };
