export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type MarketContext = {
  lastPrice: number;
  trend: "bullish" | "bearish" | "neutral";
  trendStrength: "strong" | "moderate" | "weak";
  support: number;
  resistance: number;
  volatility: "high" | "medium" | "low";
  volatilityValue: number;
  momentum: number;
  recentBehavior: string;
  activeSession: string;
  candles: Candle[];
};

/**
 * Extrai inteligência de mercado de candles OHLC.
 * Equivalente ao que um trader de nível institucional analisa visualmente.
 */
export function analyzeCandles(candles: Candle[]): MarketContext {
  if (!candles || candles.length < 10) {
    return getDefaultContext(candles?.[0]?.close ?? 1.085);
  }

  // Mais recentes primeiro
  const last20 = candles.slice(0, 20);
  const last10 = candles.slice(0, 10);
  const lastPrice = candles[0].close;

  // ── 1. TREND ──────────────────────────────────────────────────
  const oldClose = last20[last20.length - 1].close;
  const trendPct = ((lastPrice - oldClose) / oldClose) * 100;

  let trend: MarketContext["trend"];
  let trendStrength: MarketContext["trendStrength"];

  if (Math.abs(trendPct) < 0.05) {
    trend = "neutral"; trendStrength = "weak";
  } else if (trendPct > 0) {
    trend = "bullish";
    trendStrength = Math.abs(trendPct) > 0.35 ? "strong"
      : Math.abs(trendPct) > 0.15 ? "moderate" : "weak";
  } else {
    trend = "bearish";
    trendStrength = Math.abs(trendPct) > 0.35 ? "strong"
      : Math.abs(trendPct) > 0.15 ? "moderate" : "weak";
  }

  // ── 2. SUPORTE & RESISTÊNCIA (últimos 20 candles) ─────────────
  const support     = parseFloat(Math.min(...last20.map(c => c.low)).toFixed(5));
  const resistance  = parseFloat(Math.max(...last20.map(c => c.high)).toFixed(5));

  // ── 3. VOLATILIDADE (range médio) ─────────────────────────────
  const avgRange = last20.reduce((s, c) => s + (c.high - c.low), 0) / last20.length;
  const volatility: MarketContext["volatility"] =
    avgRange > 0.0050 ? "high" : avgRange > 0.0020 ? "medium" : "low";
  const volatilityValue = parseFloat(avgRange.toFixed(5));

  // ── 4. MOMENTUM (variação % últimas 10 barras) ────────────────
  const close10ago = candles[9]?.close ?? oldClose;
  const momentum   = parseFloat(((lastPrice - close10ago) / close10ago * 100).toFixed(4));

  // ── 5. PADRÃO RECENTE ─────────────────────────────────────────
  const higherHighs = last10.every((c, i) => i === 0 || c.high >= last10[i - 1].high);
  const lowerLows   = last10.every((c, i) => i === 0 || c.low  <= last10[i - 1].low);
  const higherLows  = last10.every((c, i) => i === 0 || c.low  >= last10[i - 1].low);

  let recentBehavior: string;
  if (trend === "bullish" && higherHighs && higherLows)
    recentBehavior = "higher highs and higher lows — strong bullish continuation";
  else if (trend === "bearish" && lowerLows)
    recentBehavior = "lower lows and lower highs — strong bearish continuation";
  else if (trend === "neutral")
    recentBehavior = "price consolidating within a tight range — breakout pending";
  else if (trend === "bullish")
    recentBehavior = "recovering from pullback — bullish bias with caution";
  else
    recentBehavior = "retracing from recent highs — bearish pressure building";

  // ── 6. SESSÃO ATIVA ───────────────────────────────────────────
  const activeSession = getCurrentSession();

  return {
    lastPrice,
    trend,
    trendStrength,
    support,
    resistance,
    volatility,
    volatilityValue,
    momentum,
    recentBehavior,
    activeSession,
    candles: last10,
  };
}

function getDefaultContext(price: number): MarketContext {
  return {
    lastPrice: price,
    trend: "neutral",
    trendStrength: "weak",
    support:     parseFloat((price * 0.9950).toFixed(5)),
    resistance:  parseFloat((price * 1.0050).toFixed(5)),
    volatility: "medium",
    volatilityValue: 0.0030,
    momentum: 0,
    recentBehavior: "insufficient candle data for pattern analysis",
    activeSession: "Unknown",
    candles: [],
  };
}

/**
 * Verifica se o mercado Forex está aberto.
 * Forex opera 24h/5d: abre Dom 22:00 UTC, fecha Sex 22:00 UTC.
 */
export function isForexMarketOpen(): boolean {
  const now = new Date();
  const day  = now.getUTCDay();  // 0=Dom, 5=Sex, 6=Sáb
  const hour = now.getUTCHours();

  if (day === 6) return false;                    // Sábado: sempre fechado
  if (day === 0 && hour < 22) return false;       // Domingo: abre às 22h
  if (day === 5 && hour >= 22) return false;      // Sexta: fecha às 22h

  return true;
}

/**
 * Retorna as sessões de mercado ativas no momento.
 */
export function getCurrentSession(): string {
  const hour = new Date().getUTCHours();
  const sessions: string[] = [];
  if (hour >= 0  && hour < 9)  sessions.push("Tokyo");
  if (hour >= 7  && hour < 17) sessions.push("London");
  if (hour >= 13 && hour < 22) sessions.push("New York");
  return sessions.length > 0 ? sessions.join(" + ") : "Off-hours";
  }
