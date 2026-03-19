import { analyzeCandles, type Candle, type MarketContext } from "./marketAnalysis";
import { createAdminClient } from "@/utils/supabase/admin";

export type AlphaResult = {
  latestPrice: number;
  recentBars: Candle[];
  rawMeta: Record<string, string>;
  marketContext: MarketContext;
} | null;

const ONE_HOUR_MS = 60 * 60 * 1000;

// ─── Cache do preco actual (em memoria — TTL 5 minutos) ───────────────────────
// FreeForexAPI e gratuito e ilimitado — cache em memoria e suficiente
let priceCache: { price: number; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ─── Preco actual em tempo real ───────────────────────────────────────────────

/**
 * FreeForexAPI — gratuito, sem API key, sem limite de requests.
 * Devolve o preco actual do par em tempo real.
 * Cache de 5 minutos em memoria — nao consome quota da Alpha Vantage.
 * Endpoint: https://www.freeforexapi.com/api/live?pairs=EURUSD
 */
export async function fetchCurrentPrice(pair: string): Promise<number | null> {
  // Verifica cache em memoria
  if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
    const age = Math.round((Date.now() - priceCache.timestamp) / 1000);
    console.log(`💱 Preco ${pair} (cache ${age}s): ${priceCache.price}`);
    return priceCache.price;
  }

  try {
    console.log(`💱 FreeForexAPI: A buscar preco actual de ${pair}...`);

    const res = await fetch(
      `https://www.freeforexapi.com/api/live?pairs=${pair}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Valida resposta
    if (data?.code !== 200 || !data?.rates?.[pair]?.rate) {
      console.warn(`FreeForexAPI: resposta inesperada para ${pair}:`, JSON.stringify(data).slice(0, 200));
      return priceCache?.price ?? null;
    }

    const price = parseFloat(data.rates[pair].rate.toFixed(5));
    priceCache = { price, timestamp: Date.now() };

    console.log(`💱 Preco actual ${pair}: ${price} (FreeForexAPI)`);
    return price;

  } catch (error) {
    console.error(`FreeForexAPI error para ${pair}:`, error);
    // Devolve cache expirado se existir — melhor que null
    return priceCache?.price ?? null;
  }
}

// ─── Dados historicos (candles diarios) ──────────────────────────────────────

/**
 * FX_DAILY — endpoint gratuito da Alpha Vantage.
 * Devolve candles diarios para analise de tendencia, suporte/resistencia,
 * volatilidade e momentum.
 * Cache persistente no Supabase — partilhado entre todas as instancias Vercel.
 * Actualiza no maximo 1 vez por hora.
 */
export async function fetchAlphaVantageData(pair: string): Promise<AlphaResult> {
  const supabase = createAdminClient();

  // ── 1. Verifica cache no Supabase ─────────────────────────────────────────
  try {
    const { data: cached } = await supabase
      .from("market_data_cache")
      .select("data, fetched_at")
      .eq("pair", pair)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < ONE_HOUR_MS) {
        const remaining = Math.round((ONE_HOUR_MS - age) / 60_000);
        console.log(`📦 Alpha Vantage: Cache Supabase hit para ${pair} (expira em ${remaining}min)`);
        return cached.data as AlphaResult;
      }
      console.log(`⏰ Alpha Vantage: Cache expirado para ${pair} — a fazer request`);
    }
  } catch {
    console.log(`Alpha Vantage: Sem cache para ${pair} — primeiro request`);
  }

  // ── 2. Fetch a API ─────────────────────────────────────────────────────────
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    console.warn("ALPHA_VANTAGE_KEY nao definida");
    return null;
  }

  const from = pair.slice(0, 3);
  const to   = pair.slice(3);

  const url = [
    "https://www.alphavantage.co/query",
    `?function=FX_DAILY`,
    `&from_symbol=${from}`,
    `&to_symbol=${to}`,
    `&outputsize=compact`,
    `&apikey=${apiKey}`,
  ].join("");

  try {
    console.log(`📡 Alpha Vantage: Request FX_DAILY para ${pair}...`);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw = await response.json();

    // Detecta rate limit ou endpoint premium
    if (raw["Note"] || raw["Information"]) {
      const msg = raw["Note"] ?? raw["Information"];
      console.error(`❌ Alpha Vantage bloqueado para ${pair}:`, msg.slice(0, 200));

      const { data: stale } = await supabase
        .from("market_data_cache")
        .select("data")
        .eq("pair", pair)
        .single();

      if (stale) {
        console.warn(`⚠️ Cache de emergencia para ${pair}`);
        return stale.data as AlphaResult;
      }
      return null;
    }

    const timeSeries = raw["Time Series FX (Daily)"];
    if (!timeSeries) {
      console.warn(`Sem time series para ${pair}. Resposta:`, JSON.stringify(raw).slice(0, 300));
      return null;
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

    const marketContext = analyzeCandles(recentBars);

    const result: AlphaResult = {
      latestPrice: recentBars[0].close,
      recentBars,
      rawMeta: raw["Meta Data"] ?? {},
      marketContext,
    };

    // ── 3. Guarda no cache Supabase ───────────────────────────────────────
    await supabase
      .from("market_data_cache")
      .upsert(
        { pair, data: result, fetched_at: new Date().toISOString() },
        { onConflict: "pair" }
      );

    console.log(
      `✅ Alpha Vantage: ${pair} guardado em cache — ` +
      `tendencia: ${marketContext.trend} (${marketContext.trendStrength}), ` +
      `suporte: ${marketContext.support}, resistencia: ${marketContext.resistance}`
    );
    return result;

  } catch (error) {
    console.error(`Alpha Vantage error para ${pair}:`, error);

    try {
      const { data: stale } = await supabase
        .from("market_data_cache")
        .select("data")
        .eq("pair", pair)
        .single();
      if (stale) {
        console.warn(`Cache de emergencia para ${pair}`);
        return stale.data as AlphaResult;
      }
    } catch {}

    return null;
  }
}
