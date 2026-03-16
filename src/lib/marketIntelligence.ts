export function generateMarketIntelligence(params: {
  signal: string;
  confidence: number;
}) {
  // ✅ Clampa confidence entre 0–100 para evitar NaN
  const safeConfidence = Math.min(
    100,
    Math.max(0, Number(params.confidence) || 50)
  );
  const signal = params.signal || "Neutral";

  let trend = "Neutral";
  if (signal.toUpperCase().includes("BUY")) trend = "Bullish";
  if (signal.toUpperCase().includes("SELL")) trend = "Bearish";

  // ✅ Todos os valores clampados entre 0–100
  const momentum = Math.min(
    100,
    Math.max(0, Math.round(safeConfidence + (Math.random() * 10 - 5)))
  );
  const volatility = Math.min(100, Math.round(40 + Math.random() * 40));
  const liquidity = Math.min(100, Math.round(60 + Math.random() * 30));

  // ✅ probability nunca ultrapassa 100
  const probability = Math.min(
    100,
    Math.round(safeConfidence + Math.random() * 5)
  );

  const marketScore = Math.min(
    100,
    Math.round((momentum + liquidity + probability) / 3)
  );

  return { trend, momentum, volatility, liquidity, probability, marketScore };
}
