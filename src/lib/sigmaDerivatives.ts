/**
 * Dados de derivativos — CoinGlass (funding rate, publico, sem restricoes geo)
 * Fear & Greed Index — Alternative.me (publico, sem API key)
 */

export type DerivativesData = {
  fundingRate:        number;
  fundingRatePct:     string;
  fundingSentiment:   "longs_dominant" | "shorts_dominant" | "neutral";
  openInterest:       number;
  openInterestChange: number;
  fearGreedValue:     number;
  fearGreedLabel:     string;
  fearGreedSignal:    "extreme_buy" | "buy" | "neutral" | "sell" | "extreme_sell";
};

let derivCache: Record<string, { data: DerivativesData; timestamp: number }> = {};
let fngCache:   { data: { value: number; label: string }; timestamp: number } | null = null;

const THIRTY_MIN = 30 * 60 * 1000;
const SIX_HOURS  =  6 * 60 * 60 * 1000;

export async function fetchDerivativesData(pair: string): Promise<DerivativesData | null> {
  const now    = Date.now();
  const cached = derivCache[pair];

  if (cached && now - cached.timestamp < THIRTY_MIN) {
    console.log(`Derivatives: Cache hit para ${pair}`);
    return cached.data;
  }

  try {
    console.log(`CoinGlass + FNG: A buscar derivativos para ${pair}...`);

    // ✅ CoinGlass open API — sem restricoes geograficas, sem API key
    const coin    = pair.replace("USDT", "").toUpperCase(); // BTC ou ETH
    const fngData = await fetchFearGreed();

    let fundingRate = 0;

    try {
      const res = await fetch(
        `https://open-api.coinglass.com/public/v2/funding?symbol=${coin}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const data      = await res.json();
        const exchanges: any[] = data?.data ?? [];

        // Procura Binance primeiro, depois Bybit como fallback
        const entry =
          exchanges.find((e: any) => e.exchangeName?.toLowerCase().includes("binance")) ??
          exchanges.find((e: any) => e.exchangeName?.toLowerCase().includes("bybit"))   ??
          exchanges[0];

        if (entry?.fundingRate != null) {
          // CoinGlass devolve percentagem (ex: 0.01) — converte para decimal (0.0001)
          fundingRate = parseFloat(entry.fundingRate) / 100;
        }
      } else {
        console.warn(`CoinGlass HTTP ${res.status} para ${pair} — funding=0`);
      }
    } catch {
      console.warn(`CoinGlass indisponivel para ${pair} — funding=0`);
    }

    const fundingRatePct = `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`;

    const fundingSentiment: DerivativesData["fundingSentiment"] =
      fundingRate >  0.0001 ? "longs_dominant"  :
      fundingRate < -0.0001 ? "shorts_dominant" : "neutral";

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
      openInterest:       0,
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
