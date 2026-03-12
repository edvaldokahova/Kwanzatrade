const newsCache: Record<string, { data: any; timestamp: number }> = {};
const ONE_HOUR = 60 * 60 * 1000;

export async function fetchMarketAuxData(pair: string) {
  const now = Date.now();

  if (newsCache[pair] && (now - newsCache[pair].timestamp < ONE_HOUR)) {
    console.log(`📰 MarketAux: Usando Cache Global para ${pair}`);
    return newsCache[pair].data;
  }

  const apiKey = process.env.MARKETAUX_API_KEY;
  const url = `https://api.marketaux.com/v1/forex/analysis?symbol=${pair}&api_token=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao buscar dados MarketAux");
    const data = await res.json();
    
    // Salva no Cache
    newsCache[pair] = { data, timestamp: now };
    
    return data;
  } catch (error) {
    console.error("MarketAux Error:", error);
    return null;
  }
}
