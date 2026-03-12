// Cache global em memória
const priceCache: Record<string, { data: any; timestamp: number }> = {};
const ONE_HOUR = 60 * 60 * 1000;

export async function fetchAlphaVantageData(pair: string) {
  const now = Date.now();
  
  // Verifica Cache Global
  if (priceCache[pair] && (now - priceCache[pair].timestamp < ONE_HOUR)) {
    console.log(`📦 AlphaVantage: Usando Cache Global para ${pair}`);
    return priceCache[pair].data;
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.slice(0, 3)}&to_symbol=${pair.slice(3)}&interval=5min&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Salva no Cache se os dados forem válidos
    if (data && !data["Note"]) { 
      priceCache[pair] = { data, timestamp: now };
    }

    return data;
  } catch (error) {
    console.error("AlphaVantage error:", error);
    return null;
  }
}
