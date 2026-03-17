/**
 * Server-side ONLY.
 * Dois modos de análise:
 * - fetchGeminiAnalysis: análise com parâmetros do utilizador (timeframe, risk)
 * - fetchGeminiAISuggestion: sugestão ótima livre dos parâmetros do utilizador
 */

import type { Candle } from "./marketAnalysis";

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
  const prompt = buildUserPrompt(input);
  return callGemini(prompt, input.lastPrice);
}

export async function fetchGeminiAISuggestion(
  input: AISuggestionInput
): Promise<GeminiAnalysisResult> {
  const prompt = buildAIPrompt(input);
  return callGemini(prompt, input.lastPrice);
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function candlesToText(candles: Candle[]): string {
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
1. Escolha o timeframe ÓTIMO com base nas condições atuais (não está limitado pelo utilizador)
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

// ─── Core Gemini call ─────────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  latestPrice?: number
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY não definida");
    return getDefaultResponse(latestPrice);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,   // baixo = mais determinístico e preciso
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const text: string =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Resposta vazia do Gemini");

    return parseGeminiJSON(text, latestPrice);
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    return getDefaultResponse(latestPrice);
  }
}

function parseGeminiJSON(
  text: string,
  latestPrice?: number
): GeminiAnalysisResult {
  // 1. Tenta extrair de markdown code block
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }
  // 2. Tenta objeto JSON bruto
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  console.warn("⚠️ Gemini JSON parse failed. Raw:", text.slice(0, 200));
  return getDefaultResponse(latestPrice);
}

function getDefaultResponse(latestPrice?: number): GeminiAnalysisResult {
  const price = latestPrice ?? 1.085;
  return {
    signal: "NEUTRAL",
    confidence: 50,
    entry_price: price,
    stop_loss:   parseFloat((price * 0.9985).toFixed(5)),
    take_profit: parseFloat((price * 1.003).toFixed(5)),
    suggestedTimeframe: "H1",
    tradingWindow: "Aguardar confirmação de sessão",
    riskSuggestion: "Aguardar sinal mais claro antes de entrar",
    score: "5.0 / 10",
    reasoning: "Dados insuficientes para análise precisa",
  };
  }
