/**
 * Server-side ONLY — usa GEMINI_API_KEY (variável sem NEXT_PUBLIC_).
 * Nunca importar em "use client" components.
 */

export interface GeminiAnalysisInput {
  pair: string;
  timeframe: string;
  traderLevel: string;
  latestPrice?: number;
  recentBars?: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  newsSummary?: string;
  userInput: {
    capital: number;
    risk: number;
  };
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
}

export async function fetchGeminiAnalysis(
  data: GeminiAnalysisInput
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY não definida");
    return getDefaultResponse(data.latestPrice);
  }

  const prompt = `
Você é um analisador profissional de mercado Forex. Analise os dados e responda SOMENTE com JSON válido, sem markdown e sem texto extra.

Par: ${data.pair}
Timeframe: ${data.timeframe}
Nível do trader: ${data.traderLevel}
Preço atual: ${data.latestPrice ?? "N/A"}
Últimas 10 barras (OHLC): ${JSON.stringify((data.recentBars ?? []).slice(0, 10))}
Resumo de notícias: ${data.newsSummary ?? "Sem notícias disponíveis"}
Capital: $${data.userInput.capital} | Risco: ${data.userInput.risk}%

Responda EXCLUSIVAMENTE neste formato JSON:
{
  "signal": "BUY" ou "SELL",
  "confidence": número entre 50 e 95,
  "entry_price": número,
  "stop_loss": número,
  "take_profit": número,
  "suggestedTimeframe": string,
  "tradingWindow": string,
  "riskSuggestion": string,
  "score": "X.X / 10"
}`.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
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

    return parseGeminiJSON(text, data.latestPrice);
  } catch (error) {
    console.error("Gemini Error:", error);
    return getDefaultResponse(data.latestPrice);
  }
}

function parseGeminiJSON(
  text: string,
  latestPrice?: number
): GeminiAnalysisResult {
  // ✅ 1. Tenta extrair de code block markdown
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1]);
    } catch {
      // continua
    }
  }

  // ✅ 2. Tenta encontrar objeto JSON bruto
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // continua
    }
  }

  console.warn("Gemini JSON parse failed. Raw:", text.slice(0, 300));
  return getDefaultResponse(latestPrice);
}

function getDefaultResponse(latestPrice?: number): GeminiAnalysisResult {
  const price = latestPrice ?? 1;
  return {
    signal: "NEUTRAL",
    confidence: 50,
    entry_price: price,
    stop_loss: parseFloat((price * 0.99).toFixed(5)),
    take_profit: parseFloat((price * 1.02).toFixed(5)),
    suggestedTimeframe: "H1",
    tradingWindow: "Aguardar confirmação",
    riskSuggestion: "Aguardar sinal mais claro antes de entrar",
    score: "5.0 / 10",
  };
}
