export function generateMarketIntelligence(params: {
  signal: string
  confidence: number
}) {

  const { signal, confidence } = params

  // Trend
  let trend = "Neutral"

  if (signal === "BUY") trend = "Bullish"
  if (signal === "SELL") trend = "Bearish"

  // Momentum (0-100)
  const momentum = Math.round(
    confidence + Math.random() * 10 - 5
  )

  // Volatility (0-100)
  const volatility = Math.round(
    40 + Math.random() * 40
  )

  // Liquidity (0-100)
  const liquidity = Math.round(
    60 + Math.random() * 30
  )

  // Probability
  const probability = Math.round(
    confidence + Math.random() * 5
  )

  // Market Score
  const marketScore = Math.round(
    (momentum + liquidity + probability) / 3
  )

  return {

    trend,
    momentum,
    volatility,
    liquidity,
    probability,
    marketScore

  }

}