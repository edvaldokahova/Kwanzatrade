import { createAdminClient } from "@/utils/supabase/admin";

export type CryptoCandle = {
  time: number;   // timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
};

export type CryptoMarketData = {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
};

export type CoinGeckoResult = {
  candles: CryptoCandle[];
  market: CryptoMarketData;
  support: number;
  resistance: number;
  trend: "bullish" | "bearish" | "neutral";
  trendStrength: "strong" | "moderate" | "weak";
  momentum: number;
  volatility: "high" | "medium" | "low";
  volatilityValue: number;
} | null;

// coin IDs do CoinGecko
const COIN_IDS: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function fetchCryptoData(pair: string): Promise<CoinGeckoResult> {
  const supabase    = createAdminClient();
  const cacheKey    = `crypto_${pair}`;

  // ── 1. Cache Supabase ──────────────────────────────────────────────────
  try {
    const { data: cached } = await supabase
      .from("market_data_cache")
      .select("data, fetched_at")
      .eq("pair", cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < ONE_HOUR_MS) {
        const remaining = Math.round((ONE_HOUR_MS - age) / 60_000);
        console.log(`📦 CoinGecko: Cache hit para ${pair} (expira em ${remaining}min)`);
        return cached.data as CoinGeckoResult;
      }
    }
  } catch {
    console.log(`CoinGecko: Sem cache para ${pair}`);
  }

  // ── 2. Fetch ───────────────────────────────────────────────────────────
  const apiKey  = process.env.COINGECKO_API_KEY;
  const coinId  = COIN_IDS[pair];

  if (!apiKey || !coinId) {
    console.error(`CoinGecko: API key ou coinId em falta para ${pair}`);
    return null;
  }

  const headers = {
    "x-cg-demo-api-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    console.log(`📡 CoinGecko: A buscar dados para ${pair} (${coinId})...`);

    // Fetch paralelo — OHLC 30 dias + market data
    const [ohlcRes, marketRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=30`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&price_change_percentage=24h`,
        { headers, cache: "no-store" }
      ),
    ]);

    if (!ohlcRes.ok || !marketRes.ok) {
      throw new Error(`CoinGecko HTTP: OHLC=${ohlcRes.status} Market=${marketRes.status}`);
    }

    const ohlcRaw:   number[][] = await ohlcRes.json();
    const marketRaw: any[]      = await marketRes.json();

    if (!ohlcRaw?.length || !marketRaw?.[0]) {
      console.warn(`CoinGecko: Dados em falta para ${pair}`);
      return null;
    }

    const m = marketRaw[0];

    // Converte candles
    const candles: CryptoCandle[] = ohlcRaw.map(([time, open, high, low, close]) => ({
      time, open, high, low, close,
    })).reverse(); // mais recente primeiro

    const market: CryptoMarketData = {
      currentPrice:          m.current_price,
      priceChange24h:        m.price_change_24h,
      priceChangePercent24h: m.price_change_percentage_24h,
      volume24h:             m.total_volume,
      marketCap:             m.market_cap,
      high24h:               m.high_24h,
      low24h:                m.low_24h,
    };

    // ── Analise tecnica ───────────────────────────────────────────────────
    const last20    = candles.slice(0, 20);
    const lastPrice = candles[0].close;
    const oldPrice  = last20[last20.length - 1].close;
    const trendPct  = ((lastPrice - oldPrice) / oldPrice) * 100;

    let trend: "bullish" | "bearish" | "neutral";
    let trendStrength: "strong" | "moderate" | "weak";

    if (Math.abs(trendPct) < 0.5) {
      trend = "neutral"; trendStrength = "weak";
    } else if (trendPct > 0) {
      trend = "bullish";
      trendStrength = trendPct > 5 ? "strong" : trendPct > 2 ? "moderate" : "weak";
    } else {
      trend = "bearish";
      trendStrength = Math.abs(trendPct) > 5 ? "strong" : Math.abs(trendPct) > 2 ? "moderate" : "weak";
    }

    const support    = Math.min(...last20.map(c => c.low));
    const resistance = Math.max(...last20.map(c => c.high));

    const avgRange       = last20.reduce((s, c) => s + (c.high - c.low), 0) / last20.length;
    const avgRangePct    = (avgRange / lastPrice) * 100;
    const volatility: "high" | "medium" | "low" =
      avgRangePct > 3 ? "high" : avgRangePct > 1 ? "medium" : "low";

    const close10ago = candles[9]?.close ?? oldPrice;
    const momentum   = parseFloat(((lastPrice - close10ago) / close10ago * 100).toFixed(4));

    const result: CoinGeckoResult = {
      candles: candles.slice(0, 30),
      market,
      support:        parseFloat(support.toFixed(2)),
      resistance:     parseFloat(resistance.toFixed(2)),
      trend,
      trendStrength,
      momentum,
      volatility,
      volatilityValue: parseFloat(avgRange.toFixed(2)),
    };

    // ── Guarda cache ──────────────────────────────────────────────────────
    await supabase
      .from("market_data_cache")
      .upsert(
        { pair: cacheKey, data: result, fetched_at: new Date().toISOString() },
        { onConflict: "pair" }
      );

    console.log(
      `✅ CoinGecko: ${pair} guardado — preco: $${lastPrice.toLocaleString()}, ` +
      `tendencia: ${trend}(${trendStrength}), momentum: ${momentum}%`
    );
    return result;

  } catch (error) {
    console.error(`CoinGecko error para ${pair}:`, error);

    // Fallback: cache expirado
    try {
      const { data: stale } = await supabase
        .from("market_data_cache")
        .select("data")
        .eq("pair", cacheKey)
        .single();
      if (stale) {
        console.warn(`Cache de emergencia para ${pair}`);
        return stale.data as CoinGeckoResult;
      }
    } catch {}

    return null;
  }
}
