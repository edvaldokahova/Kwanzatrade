/**
 * Server-side ONLY.
 */

import type { Candle } from "./marketAnalysis";

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

export async function fetchGeminiAnalysis(
  input: UserAnalysisInput
): Promise<GeminiAnalysisResult> {
  return callGemini(buildUserPrompt(input), input.lastPrice, "user_analysis");
}

export async function fetchGeminiAISuggestion(
  input: AISuggestionInput
): Promise<GeminiAnalysisResult> {
  return callGemini(buildAIPrompt(input), input.lastPrice, "ai_suggestion");
}

function candlesToText(candles: Candle[]): string {
  if (!candles || candles.length === 0) return "Sem dados de candles disponíveis";
  return candles.slice(0, 10).map(
    (c) => `[${c.time}] O:${c.open} H:${c.high} L:${c.low} C:${c.close}`
  ).join("\n");
}

function buildUserPrompt(input: UserAnalysisInput): string {
  return `
Você é um trader quantitativo profissional de nível institucional. Analise os dados estruturados abaixo e forneça uma análise técnica precisa.

═══ CONTEXTO DE MERCADO ESTRUTURADO ═══
Par: ${input.pair}
Preço atual: ${input.lastPrice}
Tendência (últimas 20 barras): ${input.trend} — ${input.trendStrength}
Suporte chave: ${input.support}
Resistência chave: ${input.resistance}
Volatilidade: ${input.volatility} (range médio: ${input.volatilityValue} pips)
Momentum (10 barras): ${input.momentum > 0 ? "+" : ""}${input.momentum}%
Padrão recente: ${input.recentBehavior}
Sessão ativa: ${input.activeSession}

═══ ÚLTIMOS 10 CANDLES OHLC (60min) ═══
${candlesToText(input.candles)}

═══ FUNDAMENTAL / SENTIMENTO ═══
Sentimento de notícias: ${input.newsSentiment ?? "neutral"}
Headlines: ${(input.newsHeadlines ?? []).slice(0, 3).join(" | ") || "N/A"}

═══ PARÂMETROS DO TRADER ═══
Nível: ${input.traderLevel}
Timeframe selecionado: ${input.timeframe}
Capital: $${input.capital}
Risco máximo: ${input.risk}%

INSTRUÇÕES:
- Calcule entry baseado no preço atual e contexto
- Stop loss baseado no suporte/resistência e volatilidade
- Take profit com RR mínimo 1:1.5
- Responda APENAS com JSON válido, sem markdown nem texto extra

{
  "signal": "BUY" ou "SELL",
  "confidence": número entre 55 e 90,
  "entry_price": número com 5 decimais,
  "stop_loss": número com 5 decimais,
  "take_profit": número com 5 decimais,
  "suggestedTimeframe": "${input.timeframe}",
  "tradingWindow": string descritivo da sessão,
  "riskSuggestion": string com conselho de gestão de risco,
  "score": "X.X / 10",
  "reasoning": string máx 120 chars explicando o setup
}`.trim();
}

function buildAIPrompt(input: AISuggestionInput): string {
  return `
Você é um gestor de fundos hedge com 30 anos de experiência em Forex. Tem acesso aos mesmos dados que um trader institucional. Dê a sua MELHOR sugestão, sem limitações.

═══ DADOS ESTRUTURADOS DO MERCADO ═══
Par: ${input.pair}
Preço atual: ${input.lastPrice}
Tendência: ${input.trend} (${input.trendStrength})
Suporte: ${input.support} | Resistência: ${input.resistance}
Volatilidade: ${input.volatility} — range médio ${input.volatilityValue}
Momentum: ${input.momentum > 0 ? "+" : ""}${input.momentum}%
Padrão: ${input.recentBehavior}
Sessão: ${input.activeSession}

═══ ÚLTIMOS 10 CANDLES OHLC (60min) ═══
${candlesToText(input.candles)}

═══ SENTIMENTO FUNDAMENTAL ═══
Sentimento: ${input.newsSentiment ?? "neutral"}
Headlines: ${(input.newsHeadlines ?? []).slice(0, 3).join(" | ") || "N/A"}

═══ PERFIL DO INVESTIDOR ═══
Nível de experiência: ${input.traderLevel}
Capital disponível: $${input.capital}

INSTRUÇÕES CRÍTICAS:
1. Escolha o timeframe ÓTIMO com base nas condições atuais
2. Use todo o contexto (candles, suporte/resistência, momentum, sessão, notícias)
3. Confidence acima de 80 APENAS se o setup for realmente de alta qualidade
4. Calcule níveis precisos baseados na estrutura de mercado identificada
5. Responda APENAS com JSON válido, sem markdown nem texto extra

{
  "signal": "BUY" ou "SELL",
  "confidence": número entre 65 e 94,
  "entry_price": número com 5 decimais,
  "stop_loss": número com 5 decimais,
  "take_profit": número com 5 decimais,
  "suggestedTimeframe": string (timeframe ÓTIMO escolhido pela IA),
  "tradingWindow": string descritivo,
  "riskSuggestion": string com risco % recomendado para este setup,
  "score": "X.X / 10",
  "reasoning": string máx 150 chars — o MOTIVO principal do setup
}`.trim();
}

async function callGemini(
  prompt: string,
  latestPrice?: number,
  mode: string = "unknown"
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(`❌ [${mode}] GEMINI_API_KEY não definida`);
    return getDefaultResponse(latestPrice);
  }

  // ✅ Timeout explícito de 25s por call ao Gemini
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 25_000);

  try {
    console.log(`🤖 [${mode}] Chamando Gemini...`);
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:      0.2,
            maxOutputTokens:  512,  // ✅ Reduzido de 1024 — resposta mais rápida
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [${mode}] Gemini HTTP ${response.status}:`, errorBody.slice(0, 300));
      return getDefaultResponse(latestPrice);
    }

    const result = await response.json();
    const text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      console.error(`❌ [${mode}] Gemini devolveu resposta vazia. Full response:`, JSON.stringify(result).slice(0, 500));
      return getDefaultResponse(latestPrice);
    }

    console.log(`✅ [${mode}] Gemini respondeu em ${duration}s`);
    return parseGeminiJSON(text, latestPrice, mode);

  } catch (error: any) {
    clearTimeout(timeoutId);

    // ✅ Distingue timeout de outros erros
    if (error?.name === "AbortError") {
      console.error(`❌ [${mode}] Gemini TIMEOUT — chamada abortada após 25s`);
    } else {
      console.error(`❌ [${mode}] Gemini Error:`, error?.message ?? error);
    }

    return getDefaultResponse(latestPrice);
  }
}

function parseGeminiJSON(
  text: string,
  latestPrice?: number,
  mode: string = "unknown"
): GeminiAnalysisResult {
  // 1. Tenta extrair de markdown code block
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try {
      const parsed = JSON.parse(codeBlock[1]);
      console.log(`✅ [${mode}] JSON extraído de code block`);
      return parsed;
    } catch {}
  }

  // 2. Tenta objeto JSON bruto
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      console.log(`✅ [${mode}] JSON extraído de texto bruto`);
      return parsed;
    } catch {}
  }

  // 3. Falhou — loga o texto completo para diagnóstico
  console.error(`❌ [${mode}] JSON parse FALHOU. Texto completo do Gemini:\n${text}`);
  return getDefaultResponse(latestPrice);
}

function getDefaultResponse(latestPrice?: number): GeminiAnalysisResult {
  const price = latestPrice ?? 1.085;
  return {
    signal:             "NEUTRAL",
    confidence:         50,
    entry_price:        price,
    stop_loss:          parseFloat((price * 0.9985).toFixed(5)),
    take_profit:        parseFloat((price * 1.003).toFixed(5)),
    suggestedTimeframe: "H1",
    tradingWindow:      "Aguardar confirmação de sessão",
    riskSuggestion:     "Aguardar sinal mais claro antes de entrar",
    score:              "5.0 / 10",
    reasoning:          "Dados insuficientes para análise precisa",
  };
}
