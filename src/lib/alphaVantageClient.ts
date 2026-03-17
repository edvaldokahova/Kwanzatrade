import { analyzeCandles, type Candle, type MarketContext } from "./marketAnalysis";

export type AlphaResult = {
  latestPrice: number;
  recentBars: Candle[];
  rawMeta: Record<string, string>;
  marketContext: MarketContext;
} | null;

// Cache global em memória (persiste enquanto o processo Node estiver vivo)
const priceCache: Record<string, { data: AlphaResult; timestamp: number }> = {};
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Busca dados FX_INTRADAY (60min) para extrair contexto de mercado rico.
 * 1 request = ~100 candles históricos = tendência + suporte/resistência + volatilidade + momentum.
 * Cache de 1h para respeitar o limite de 25 requests/dia do plano gratuito.
 */
export async function fetchAlphaVantageData(pair: string): Promise<AlphaResult> {
  const now = Date.now();

  // ✅ Cache hit — não faz request
  if (priceCache[pair] && now - priceCache[pair].timestamp < ONE_HOUR) {
    console.log(`📦 AlphaVantage: Cache hit para ${pair}`);
    return priceCache[pair].data;
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    console.warn("⚠️ ALPHA_VANTAGE_KEY não definida");
    return null;
  }

  const from = pair.slice(0, 3);
  const to   = pair.slice(3);

  // 60min interval = melhor contexto histórico, menos pontos = mais eficiente
  const url = [
    "https://www.alphavantage.co/query",
    `?function=FX_INTRADAY`,
    `&from_symbol=${from}`,
    `&to_symbol=${to}`,
    `&interval=60min`,
    `&outputsize=compact`,  // últimas 100 barras
    `&apikey=${apiKey}`,
  ].join("");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw = await response.json();

    // Detecta rate limit antes de processar
    if (raw["Note"] || raw["Information"]) {
      console.warn("⚠️ AlphaVantage rate limit:", raw["Note"] ?? raw["Information"]);
      return priceCache[pair]?.data ?? null;
    }

    const timeSeries = raw["Time Series FX (60min)"];
    if (!timeSeries) {
      console.warn(`⚠️ Sem time series para ${pair}`);
      return priceCache[pair]?.data ?? null;
    }

    const keys = Object.keys(timeSeries);
    if (keys.length === 0) return null;

    // Candles ordenados do mais recente para o mais antigo
    const recentBars: Candle[] = keys.slice(0, 100).map((k) => ({
      time:  k,
      open:  parseFloat(timeSeries[k]["1. open"]),
      high:  parseFloat(timeSeries[k]["2. high"]),
      low:   parseFloat(timeSeries[k]["3. low"]),
      close: parseFloat(timeSeries[k]["4. close"]),
    }));

    // ✅ Extrai inteligência de mercado dos candles
    const marketContext = analyzeCandles(recentBars);

    const result: AlphaResult = {
      latestPrice: recentBars[0].close,
      recentBars,
      rawMeta: raw["Meta Data"] ?? {},
      marketContext,
    };

    priceCache[pair] = { data: result, timestamp: now };
    console.log(`✅ AlphaVantage: ${pair} atualizado — preço: ${result.latestPrice}, tendência: ${marketContext.trend}`);
    return result;

  } catch (error) {
    console.error("❌ AlphaVantage error:", error);
    return priceCache[pair]?.data ?? null;
  }
}
