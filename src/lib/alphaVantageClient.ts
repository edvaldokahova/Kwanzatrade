// src/lib/alphaVantageClient.ts

export async function fetchAlphaVantageData(pair: string) {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;

  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.slice(
    0,
    3
  )}&to_symbol=${pair.slice(3)}&interval=5min&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("AlphaVantage error:", error);
    return null;
  }
}