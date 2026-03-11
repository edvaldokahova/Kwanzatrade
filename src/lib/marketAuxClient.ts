// src/lib/marketAuxClient.ts
export async function fetchMarketAuxData(pair: string) {
  const apiKey = process.env.MARKETAUX_API_KEY;
  const url = `https://api.marketaux.com/v1/forex/analysis?symbol=${pair}&api_token=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao buscar dados MarketAux");
    const data = await res.json();
    return data; // Retorna objeto JSON com análises
  } catch (error) {
    console.error("MarketAux Error:", error);
    return null;
  }
}