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
PASSO 3 — src/lib/sigmaDerivatives.ts
/**
 * Dados de derivativos — Binance Futures (publico, sem API key)
 * e Fear & Greed Index — Alternative.me (publico, sem API key)
 */

export type DerivativesData = {
  fundingRate:     number;   // ex: 0.0001 = 0.01%
  fundingRatePct:  string;   // ex: "+0.010%"
  fundingSentiment: "longs_dominant" | "shorts_dominant" | "neutral";
  openInterest:    number;   // em USD
  openInterestChange: number; // % vs hora anterior
  fearGreedValue:  number;   // 0-100
  fearGreedLabel:  string;   // "Extreme Fear" / "Fear" / "Neutral" / "Greed" / "Extreme Greed"
  fearGreedSignal: "extreme_buy" | "buy" | "neutral" | "sell" | "extreme_sell";
};

// Cache em memoria — ilimitado, sem custo
let derivCache: Record<string, { data: DerivativesData; timestamp: number }> = {};
let fngCache:   { data: { value: number; label: string }; timestamp: number } | null = null;

const THIRTY_MIN  = 30 * 60 * 1000;
const SIX_HOURS   = 6  * 60 * 60 * 1000;

// Binance symbol format: BTCUSDT, ETHUSDT
const BINANCE_SYMBOLS: Record<string, string> = {
  BTCUSDT: "BTCUSDT",
  ETHUSDT: "ETHUSDT",
};

export async function fetchDerivativesData(pair: string): Promise<DerivativesData | null> {
  const now    = Date.now();
  const cached = derivCache[pair];

  if (cached && now - cached.timestamp < THIRTY_MIN) {
    console.log(`📦 Derivatives: Cache hit para ${pair}`);
    return cached.data;
  }

  const symbol = BINANCE_SYMBOLS[pair];
  if (!symbol) {
    console.warn(`Derivatives: symbol nao encontrado para ${pair}`);
    return null;
  }

  try {
    console.log(`📡 Binance + FNG: A buscar derivativos para ${pair}...`);

    // Fetch paralelo — Funding Rate + Open Interest + Fear & Greed
    const [fundingRes, oiRes, fngData] = await Promise.all([
      fetch(
        `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`,
        { cache: "no-store" }
      ),
      fetch(
        `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`,
        { cache: "no-store" }
      ),
      fetchFearGreed(),
    ]);

    if (!fundingRes.ok || !oiRes.ok) {
      throw new Error(`Binance HTTP: Funding=${fundingRes.status} OI=${oiRes.status}`);
    }

    const fundingRaw: any[] = await fundingRes.json();
    const oiRaw:      any   = await oiRes.json();

    const fundingRate    = parseFloat(fundingRaw?.[0]?.fundingRate ?? "0");
    const fundingRatePct = `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`;

    // Funding positivo = longs pagam shorts = maioria LONG = pressao para SHORT
    const fundingSentiment: DerivativesData["fundingSentiment"] =
      fundingRate >  0.0001 ? "longs_dominant"  :
      fundingRate < -0.0001 ? "shorts_dominant" : "neutral";

    const openInterest = parseFloat(oiRaw?.openInterest ?? "0") *
      parseFloat(oiRaw?.openInterest ?? "1"); // em contratos — simplificado

    // Fear & Greed
    const fearGreedValue = fngData?.value ?? 50;
    const fearGreedLabel = fngData?.label ?? "Neutral";

    const fearGreedSignal: DerivativesData["fearGreedSignal"] =
      fearGreedValue >= 80 ? "extreme_sell" :
      fearGreedValue >= 60 ? "sell"         :
      fearGreedValue <= 20 ? "extreme_buy"  :
      fearGreedValue <= 40 ? "buy"          : "neutral";

    const result: DerivativesData = {
      fundingRate,
      fundingRatePct,
      fundingSentiment,
      openInterest:       parseFloat(oiRaw?.openInterest ?? "0"),
      openInterestChange: 0, // simplificado
      fearGreedValue,
      fearGreedLabel,
      fearGreedSignal,
    };

    derivCache[pair] = { data: result, timestamp: now };

    console.log(
      `✅ Derivatives: ${pair} — funding: ${fundingRatePct} (${fundingSentiment}), ` +
      `F&G: ${fearGreedValue}/100 (${fearGreedLabel})`
    );
    return result;

  } catch (error) {
    console.error(`Derivatives error para ${pair}:`, error);
    return derivCache[pair]?.data ?? null;
  }
}

async function fetchFearGreed(): Promise<{ value: number; label: string } | null> {
  if (fngCache && Date.now() - fngCache.timestamp < SIX_HOURS) {
    return fngCache.data;
  }

  try {
    const res  = await fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" });
    const data = await res.json();
    const item = data?.data?.[0];

    if (!item) return null;

    const result = {
      value: parseInt(item.value),
      label: item.value_classification,
    };

    fngCache = { data: result, timestamp: Date.now() };
    return result;
  } catch {
    return fngCache?.data ?? null;
  }
}
