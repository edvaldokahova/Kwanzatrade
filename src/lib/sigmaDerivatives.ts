/**
 * Dados de derivativos — Bybit Futures (publico, sem API key, sem restricoes geo)
 * Fear & Greed Index — Alternative.me (publico, sem API key)
 */

export type DerivativesData = {
  fundingRate:      number;
  fundingRatePct:   string;
  fundingSentiment: "longs_dominant" | "shorts_dominant" | "neutral";
  openInterest:     number;
  openInterestChange: number;
  fearGreedValue:   number;
  fearGreedLabel:   string;
  fearGreedSignal:  "extreme_buy" | "buy" | "neutral" | "sell" | "extreme_sell";
};

let derivCache: Record<string, { data: DerivativesData; timestamp: number }> = {};
let fngCache:   { data: { value: number; label: string }; timestamp: number } | null = null;

const THIRTY_MIN = 30 * 60 * 1000;
const SIX_HOURS  =  6 * 60 * 60 * 1000;

// ✅ Bybit symbols — sem restricoes geograficas
const BYBIT_SYMBOLS: Record<string, string> = {
  BTCUSDT: "BTCUSDT",
  ETHUSDT: "ETHUSDT",
};

export async function fetchDerivativesData(pair: string): Promise<DerivativesData | null> {
  const now    = Date.now();
  const cached = derivCache[pair];

  if (cached && now - cached.timestamp < THIRTY_MIN) {
    console.log(`Derivatives: Cache hit para ${pair}`);
    return cached.data;
  }

  const symbol = BYBIT_SYMBOLS[pair];
  if (!symbol) return null;

  try {
    console.log(`Bybit + FNG: A buscar derivativos para ${pair}...`);

    // ✅ Bybit V5 API — funding rate publica, sem restricoes
    const [fundingRes, fngData] = await Promise.all([
      fetch(
        `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${symbol}&limit=1`,
        { cache: "no-store" }
      ),
      fetchFearGreed(),
    ]);

    let fundingRate = 0;

    if (fundingRes.ok) {
      const fundingJson = await fundingRes.json();
      const latestFunding = fundingJson?.result?.list?.[0];
      if (latestFunding?.fundingRate) {
        fundingRate = parseFloat(latestFunding.fundingRate);
      }
    } else {
      console.warn(`Bybit funding HTTP ${fundingRes.status} — usando 0`);
    }

    const fundingRatePct = `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`;

    const fundingSentiment: DerivativesData["fundingSentiment"] =
      fundingRate >  0.0001 ? "longs_dominant"  :
      fundingRate < -0.0001 ? "shorts_dominant" : "neutral";

    // ✅ Bybit Open Interest
    let openInterest = 0;
    try {
      const oiRes  = await fetch(
        `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&limit=1`,
        { cache: "no-store" }
      );
      if (oiRes.ok) {
        const oiJson = await oiRes.json();
        openInterest = parseFloat(oiJson?.result?.list?.[0]?.openInterest ?? "0");
      }
    } catch {
      console.warn("Bybit OI indisponivel — continuando sem OI");
    }

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
      openInterest,
      openInterestChange: 0,
      fearGreedValue,
      fearGreedLabel,
      fearGreedSignal,
    };

    derivCache[pair] = { data: result, timestamp: now };

    console.log(
      `Derivatives: ${pair} — funding: ${fundingRatePct} (${fundingSentiment}), ` +
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
    console.log(`Fear & Greed: ${result.value}/100 (${result.label})`);
    return result;
  } catch {
    return fngCache?.data ?? null;
  }
}
