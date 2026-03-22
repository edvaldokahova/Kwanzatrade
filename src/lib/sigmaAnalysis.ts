import { fetchCryptoData, type CoinGeckoResult, type CryptoCandle } from "./coinGeckoClient";
import { fetchDerivativesData, type DerivativesData }  from "./sigmaDerivatives";

export interface SigmaUserInput {
  pair:        string;  // "BTCUSDT" ou "ETHUSDT"
  capital:     number;
  leverage:    number;
  risk:        number;
  traderLevel: string;
}

export interface SigmaResult {
  pair:           string;
  signal:         "LONG" | "SHORT" | "NEUTRAL";
  confidence:     number;
  entry:          number;
  stopLoss:       number;
  takeProfit:     number;
  leverage:       number;
  liquidation:    number;
  margin:         number;
  positionSize:   string;
  riskReward:     string;
  profitPotential: string;
  fundingRate:    string;
  fearGreed:      number;
  fearGreedLabel: string;
  score:          string;
  reasoning:      string;
  tradingWindow:  string;
  riskSuggestion: string;
  trend:          string;
  momentum:       number;
  support:        number;
  resistance:     number;
}

// ─── Calcula campos de futuros ────────────────────────────────────────────────

function calcFutures(
  entry: number,
  sl: number,
  tp: number,
  signal: string,
  capital: number,
  leverage: number,
  risk: number
) {
  const isLong     = signal === "LONG";
  const slDist     = Math.abs(entry - sl);
  const tpDist     = Math.abs(tp - entry);
  const rr         = slDist > 0 ? tpDist / slDist : 0;
  const riskAmount = capital * (risk / 100);
  const margin     = parseFloat((capital / leverage).toFixed(2));
  const posSize    = parseFloat(((capital * leverage) / entry).toFixed(6));
  const profit     = riskAmount * Math.max(rr, 0);

  // Liquidation price
  const liqBuffer  = 0.004; // 0.4% manutencao de margem
  const liquidation = isLong
    ? parseFloat((entry * (1 - 1 / leverage + liqBuffer)).toFixed(2))
    : parseFloat((entry * (1 + 1 / leverage - liqBuffer)).toFixed(2));

  return {
    margin,
    positionSize:    posSize.toString(),
    riskReward:      isFinite(rr)      ? rr.toFixed(2)      : "0.00",
    profitPotential: isFinite(profit)  ? profit.toFixed(2)  : "0.00",
    liquidation,
  };
}

// ─── Candles para texto ───────────────────────────────────────────────────────

function candlesToText(candles: CryptoCandle[]): string {
  if (!candles?.length) return "N/A";
  return candles.slice(0, 10).map((c) => {
    const date = new Date(c.time).toISOString().split("T")[0];
    return `${date} O:${c.open} H:${c.high} L:${c.low} C:${c.close}`;
  }).join("\n");
}

// ─── Prompt SIGMA BOT ─────────────────────────────────────────────────────────

function buildSigmaPrompt(
  input: SigmaUserInput,
  crypto: CoinGeckoResult,
  deriv: DerivativesData | null
): string {
  const p     = crypto!;
  const price = p.market.currentPrice;

  // Entry estrategico baseado em estrutura
  const isBullishSignal = p.trend === "bullish" && p.momentum > 0 &&
    (deriv?.fundingSentiment !== "longs_dominant") &&
    (deriv?.fearGreedSignal !== "extreme_sell");

  const distToSupport    = Math.abs(price - p.support);
  const distToResistance = Math.abs(p.resistance - price);

  const exampleEntry = isBullishSignal
    ? parseFloat((p.support + distToSupport * 0.2).toFixed(2))
    : parseFloat((p.resistance - distToResistance * 0.2).toFixed(2));

  const exampleSL = isBullishSignal
    ? parseFloat((p.support * 0.995).toFixed(2))
    : parseFloat((p.resistance * 1.005).toFixed(2));

  const exampleTP = isBullishSignal
    ? parseFloat((p.resistance * 0.998).toFixed(2))
    : parseFloat((p.support * 1.002).toFixed(2));

  const fundingContext = deriv
    ? `funding_rate=${deriv.fundingRatePct}(${deriv.fundingSentiment}) | fear_greed=${deriv.fearGreedValue}/100(${deriv.fearGreedLabel})`
    : "derivatives_unavailable";

  return [
    "You are an elite crypto futures trader combining Soros reflexivity with James Wynn liquidity hunting.",
    "CORE PRINCIPLES:",
    "1. REFLEXIVITY (Soros): markets are psychological. Find where the crowd is WRONG.",
    "2. LIQUIDITY HUNTING (Wynn): the market exists to LIQUIDATE the majority. Trade against overcrowded positions.",
    "3. VOLATILITY = OPPORTUNITY: crypto moves fast. Entry precision and tight SL are everything.",
    "",
    "=== MARKET STRUCTURE ===",
    `pair=${input.pair}`,
    `current_price=${price}`,
    `trend=${p.trend}(${p.trendStrength})`,
    `support=${p.support} | resistance=${p.resistance}`,
    `volatility=${p.volatility}(avg_range=$${p.volatilityValue})`,
    `momentum=${p.momentum > 0 ? "+" : ""}${p.momentum}%`,
    `24h_change=${p.market.priceChangePercent24h > 0 ? "+" : ""}${p.market.priceChangePercent24h?.toFixed(2)}%`,
    `24h_high=${p.market.high24h} | 24h_low=${p.market.low24h}`,
    `volume_24h=$${(p.market.volume24h / 1_000_000).toFixed(0)}M`,
    "",
    "=== DERIVATIVES INTELLIGENCE ===",
    fundingContext,
    "INTERPRETATION:",
    "- Funding POSITIVE = longs paying shorts = crowd is LONG = potential SHORT setup",
    "- Funding NEGATIVE = shorts paying longs = crowd is SHORT = potential LONG setup",
    "- Fear & Greed > 75 = extreme greed = market overbought = SHORT bias",
    "- Fear & Greed < 25 = extreme fear = market oversold = LONG bias",
    "",
    "=== PRICE HISTORY (daily candles, most recent first) ===",
    candlesToText(p.candles),
    "",
    "=== TRADER PROFILE ===",
    `level=${input.traderLevel} | capital=$${input.capital} | max_leverage=${input.leverage}x | risk=${input.risk}%`,
    "",
    "=== DECISION RULES ===",
    "1. CONFLUENCE: trend + momentum + derivatives must align. If conflicting = NEUTRAL.",
    "2. ENTRY at STRUCTURAL LEVEL — never at current price. Find the key level.",
    "3. STOP LOSS beyond structural invalidation. Crypto moves fast — SL must be real.",
    "4. TAKE PROFIT at next structural level. Minimum R/R = 1:1.5.",
    "5. LEVERAGE: suggest 5x if confidence<70, 10x if 70-85, 20x only if >85 AND volatility=low.",
    "6. If no quality setup exists, signal=NEUTRAL. Never force a bad trade.",
    "7. ALL prices must be rounded to 2 decimal places.",
    "",
    "Respond with a single JSON object only. No markdown. No explanation.",
    `{"signal":"${isBullishSignal ? "LONG" : "SHORT"}","confidence":75,"entry_price":${exampleEntry},"stop_loss":${exampleSL},"take_profit":${exampleTP},"leverage":10,"suggestedTimeframe":"H4","tradingWindow":"${new Date().getUTCHours() >= 13 && new Date().getUTCHours() < 22 ? "New York + London" : "Asian Session"}","riskSuggestion":"Use max ${input.leverage}x — tight SL at structural level","score":"7.5 / 10","reasoning":"Funding rate signals overcrowded longs — structural SELL at resistance with F&G overbought"}`,
  ].join("\n");
}

// ─── Chama Gemini ─────────────────────────────────────────────────────────────

async function callGeminiSigma(
  prompt: string,
  currentPrice: number
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:      0.15,
            maxOutputTokens:  2048,
            responseMimeType: "application/json",
            thinkingConfig:   { thinkingBudget: 0 },
          },
        }),
      }
    );

    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`Gemini SIGMA HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return null;

    try { return JSON.parse(text.trim()); } catch { return null; }

  } catch (err: any) {
    clearTimeout(timeout);
    console.error("Gemini SIGMA error:", err?.message);
    return null;
  }
}

// ─── Exports principal ─────────────────────────────────────────────────────────

export async function runSigmaAnalysis(input: SigmaUserInput): Promise<SigmaResult> {
  const { pair, capital, leverage, risk } = input;

  console.log(`SIGMA: Analise iniciada — ${pair} | Capital: $${capital} | Leverage: ${leverage}x`);

  // 1. Fetch paralelo — CoinGecko + Derivatives
  const [cryptoData, derivData] = await Promise.all([
    fetchCryptoData(pair),
    fetchDerivativesData(pair),
  ]);

  if (!cryptoData) {
    console.error(`SIGMA: Sem dados de mercado para ${pair}`);
    return getDefaultSigmaResult(pair, cryptoData?.market.currentPrice ?? 0);
  }

  const currentPrice = cryptoData.market.currentPrice;

  // 2. Chama Gemini
  const prompt  = buildSigmaPrompt(input, cryptoData, derivData);
  const gemini  = await callGeminiSigma(prompt, currentPrice);

  if (!gemini || !gemini.signal || !gemini.entry_price) {
    console.warn("SIGMA: Gemini falhou — usando fallback");
    return getDefaultSigmaResult(pair, currentPrice);
  }

  // 3. Valida precos — cripto pode ter range maior (5% do preco)
  const maxDist   = currentPrice * 0.05;
  const entry     = validateCryptoPrice(gemini.entry_price, currentPrice, maxDist);
  const sl        = validateCryptoPrice(gemini.stop_loss,   entry,        maxDist);
  const tp        = validateCryptoPrice(gemini.take_profit, entry,        maxDist * 2);
  const lev       = Math.min(Math.max(Number(gemini.leverage) || leverage, 1), 20);
  const signal    = ["LONG", "SHORT", "NEUTRAL"].includes(gemini.signal) ? gemini.signal : "NEUTRAL";

  // 4. Calcula campos de futuros
  const futures = calcFutures(entry, sl, tp, signal, capital, lev, risk);

  const result: SigmaResult = {
    pair,
    signal,
    confidence:      Math.min(94, Math.max(50, Number(gemini.confidence) || 55)),
    entry,
    stopLoss:        sl,
    takeProfit:      tp,
    leverage:        lev,
    liquidation:     futures.liquidation,
    margin:          futures.margin,
    positionSize:    futures.positionSize,
    riskReward:      futures.riskReward,
    profitPotential: futures.profitPotential,
    fundingRate:     derivData?.fundingRatePct    ?? "N/A",
    fearGreed:       derivData?.fearGreedValue    ?? 50,
    fearGreedLabel:  derivData?.fearGreedLabel    ?? "Neutral",
    score:           gemini.score                 ?? "5.0 / 10",
    reasoning:       gemini.reasoning             ?? "",
    tradingWindow:   gemini.tradingWindow         ?? "24/7",
    riskSuggestion:  gemini.riskSuggestion        ?? "Use gestao de risco conservadora",
    trend:           cryptoData.trend,
    momentum:        cryptoData.momentum,
    support:         cryptoData.support,
    resistance:      cryptoData.resistance,
  };

  console.log(`✅ SIGMA: ${pair} ${signal} | Entry: $${entry} | Leverage: ${lev}x | RR: 1:${result.riskReward}`);
  return result;
}

function validateCryptoPrice(
  val: any,
  reference: number,
  maxDist: number
): number {
  const n = parseFloat(String(val));
  if (isNaN(n) || n <= 0) return parseFloat(reference.toFixed(2));
  if (Math.abs(n - reference) > maxDist) return parseFloat(reference.toFixed(2));
  return parseFloat(n.toFixed(2));
}

function getDefaultSigmaResult(pair: string, price: number): SigmaResult {
  const p = price || 50000;
  return {
    pair,
    signal:          "NEUTRAL",
    confidence:      50,
    entry:           p,
    stopLoss:        parseFloat((p * 0.975).toFixed(2)),
    takeProfit:      parseFloat((p * 1.05).toFixed(2)),
    leverage:        5,
    liquidation:     parseFloat((p * 0.82).toFixed(2)),
    margin:          0,
    positionSize:    "0",
    riskReward:      "0.00",
    profitPotential: "0.00",
    fundingRate:     "N/A",
    fearGreed:       50,
    fearGreedLabel:  "Neutral",
    score:           "5.0 / 10",
    reasoning:       "Dados insuficientes para analise",
    tradingWindow:   "24/7",
    riskSuggestion:  "Aguardar sinal com maior confluencia",
    trend:           "neutral",
    momentum:        0,
    support:         parseFloat((p * 0.95).toFixed(2)),
    resistance:      parseFloat((p * 1.05).toFixed(2)),
  };
}
