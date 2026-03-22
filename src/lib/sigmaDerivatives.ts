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
