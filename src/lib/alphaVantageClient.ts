export type AlphaResult = {
  latestPrice: number;
  recentBars: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  rawMeta: Record<string, string>;
} | null;

// Cache global em memória (servidor)
const priceCache: Record<string, { data: AlphaResult; timestamp: number }> = {};
const ONE_HOUR = 60 * 60 * 1000;

export async function fetchAlphaVantageData(pair: string): Promise<AlphaResult> {
  const now = Date.now();

  if (priceCache[pair] && now - priceCache[pair].timestamp < ONE_HOUR) {
    console.log(`📦 AlphaVantage: Cache hit para ${pair}`);
    return priceCache[pair].data;
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    console.warn("ALPHA_VANTAGE_KEY não definida");
    return null;
  }

  const fromSymbol = pair.slice(0, 3);
  const toSymbol = pair.slice(3);
  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&interval=5min&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw = await response.json();

    // ✅ Detecta rate limit antes de processar
    if (raw["Note"] || raw["Information"]) {
      console.warn("AlphaVantage rate limit:", raw["Note"] ?? raw["Information"]);
      return priceCache[pair]?.data ?? null;
    }

    const timeSeries = raw["Time Series FX (5min)"];
    if (!timeSeries) {
      console.warn(`Sem time series para ${pair}`);
      return null;
    }

    const keys = Object.keys(timeSeries);
    if (keys.length === 0) return null;

    // ✅ Extrai recentBars e latestPrice do response
    const recentBars = keys.slice(0, 30).map((k) => ({
      time: k,
      open: parseFloat(timeSeries[k]["1. open"]),
      high: parseFloat(timeSeries[k]["2. high"]),
      low: parseFloat(timeSeries[k]["3. low"]),
      close: parseFloat(timeSeries[k]["4. close"]),
    }));

    const result: AlphaResult = {
      latestPrice: recentBars[0].close,
      recentBars,
      rawMeta: raw["Meta Data"] ?? {},
    };

    priceCache[pair] = { data: result, timestamp: now };
    return result;
  } catch (error) {
    console.error("AlphaVantage error:", error);
    return priceCache[pair]?.data ?? null;
  }
}
