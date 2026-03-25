import { analyzeCandles, type Candle, type MarketContext } from "./marketAnalysis";
import { createAdminClient } from "@/utils/supabase/admin";

export type AlphaResult = {
  latestPrice: number;
  recentBars: Candle[];
  rawMeta: Record<string, string>;
  marketContext: MarketContext;
} | null;

const ONE_HOUR_MS = 60 * 60 * 1000;

// ─── Cache do preco actual (em memoria — TTL 1 hora) ──────────────────────────
// Frankfurter actualiza diariamente — consistente com os candles FX_DAILY
// Ilimitado e sem API key — cache em memoria e suficiente
let priceCache: { price: number; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 60 * 60 * 1000; // 1 hora

// ─── Preco actual em tempo real ───────────────────────────────────────────────

/**
 * Frankfurter API — Banco Central Europeu.
 * Gratuito, sem API key, sem limite de requests.
 * Actualiza diariamente — consistente com os candles FX_DAILY que usamos.
 * Endpoint: https://api.frankfurter.app/latest?from=EUR&to=USD
 * Exemplo de resposta: {"amount":1.0,"base":"EUR","date":"2026-03-19","rates":{"USD":1.1489}}
 */
export async function fetchCurrentPrice(pair: string): Promise<number | null> {
  if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
    const age = Math.round((Date.now() - priceCache.timestamp) / 60_000);
    console.log(`💱 Preco ${pair} (cache ${age}min): ${priceCache.price}`);
    return priceCache.price;
  }

  const base  = pair.slice(0, 3); // EUR
  const quote = pair.slice(3);    // USD

  // ✅ Fonte 1 — Frankfurter (BCE) — actualiza 1x/dia
  try {
    console.log(`💱 Frankfurter: A buscar preco de ${pair}...`);
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data  = await res.json();
      const price = data?.rates?.[quote];
      if (price) {
        const parsed = parseFloat(parseFloat(price).toFixed(5));
        priceCache   = { price: parsed, timestamp: Date.now() };
        console.log(`💱 Preco ${pair}: ${parsed} (Frankfurter/BCE — ${data.date})`);
        return parsed;
      }
    }
  } catch {
    console.warn(`Frankfurter indisponivel — a tentar MoneyConvert...`);
  }

  // ✅ Fonte 2 — MoneyConvert — actualiza a cada ~5 minutos, sem API key
  try {
    console.log(`💱 MoneyConvert: fallback para ${pair}...`);
    const res = await fetch(
      "https://cdn.moneyconvert.net/api/latest.json",
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      // Base e USD — para EURUSD: 1 / rates.EUR
      const baseRate = data?.rates?.[base];
      if (baseRate && baseRate > 0) {
        const price  = parseFloat((1 / baseRate).toFixed(5));
        priceCache   = { price, timestamp: Date.now() };
        console.log(`💱 Preco ${pair}: ${price} (MoneyConvert fallback)`);
        return price;
      }
    }
  } catch {
    console.warn(`MoneyConvert tambem indisponivel para ${pair}`);
  }

  // ✅ Fonte 3 — cache expirado e melhor que nada
  if (priceCache?.price) {
    console.warn(`💱 A usar cache expirado para ${pair}: ${priceCache.price}`);
    return priceCache.price;
  }

  return null;
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
