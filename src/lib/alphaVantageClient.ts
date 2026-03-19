import { analyzeCandles, type Candle, type MarketContext } from "./marketAnalysis";
import { createAdminClient } from "@/utils/supabase/admin";

export type AlphaResult = {
  latestPrice: number;
  recentBars: Candle[];
  rawMeta: Record<string, string>;
  marketContext: MarketContext;
} | null;

const ONE_HOUR_MS = 60 * 60 * 1000;

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
        console.log(`📦 Alpha Vantage: Cache hit para ${pair} (expira em ${remaining}min)`);
        return cached.data as AlphaResult;
      }
      console.log(`⏰ Alpha Vantage: Cache expirado para ${pair} — a fazer request`);
    }
  } catch {
    console.log(`ℹ️ Alpha Vantage: Sem cache para ${pair}`);
  }

  // ── 2. Fetch à API ────────────────────────────────────────────────────────
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    console.warn("⚠️ ALPHA_VANTAGE_KEY não definida");
    return null;
  }

  const from = pair.slice(0, 3);
  const to   = pair.slice(3);

  // ✅ FX_DAILY — endpoint gratuito
  // Devolve candles diários: suficiente para tendência, S/R e momentum
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

      // Devolve cache antigo mesmo expirado se existir
      const { data: stale } = await supabase
        .from("market_data_cache")
        .select("data")
        .eq("pair", pair)
        .single();

      if (stale) {
        console.warn(`⚠️ A usar cache de emergência para ${pair}`);
        return stale.data as AlphaResult;
      }
      return null;
    }

    // ✅ FX_DAILY retorna "Time Series FX (Daily)"
    const timeSeries = raw["Time Series FX (Daily)"];
    if (!timeSeries) {
      console.warn(`⚠️ Sem time series para ${pair}. Resposta:`, JSON.stringify(raw).slice(0, 300));
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
      `preco: ${result.latestPrice}, tendencia: ${marketContext.trend} (${marketContext.trendStrength})`
    );
    return result;

  } catch (error) {
    console.error(`❌ Alpha Vantage error para ${pair}:`, error);

    // Fallback de emergência
    try {
      const { data: stale } = await supabase
        .from("market_data_cache")
        .select("data")
        .eq("pair", pair)
        .single();
      if (stale) {
        console.warn(`⚠️ Cache de emergência para ${pair}`);
        return stale.data as AlphaResult;
      }
    } catch {}

    return null;
  }
}
