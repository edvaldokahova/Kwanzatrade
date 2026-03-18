export type MarketAuxResult = {
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  headlines: string[];
} | null;

const newsCache: Record<string, { data: MarketAuxResult; timestamp: number }> = {};

// 2 requests por dia = cache de 12 horas
// 2 x 30 dias = 60 requests/mes (limite: 100)
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export async function fetchMarketAuxData(pair: string): Promise<MarketAuxResult> {
  const now = Date.now();

  if (newsCache[pair] && now - newsCache[pair].timestamp < TWELVE_HOURS) {
    console.log(`MarketAux: Cache hit para ${pair} (valido por mais ${Math.round((TWELVE_HOURS - (now - newsCache[pair].timestamp)) / 3600000)}h)`);
    return newsCache[pair].data;
  }

  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) {
    console.warn("MARKETAUX_API_KEY nao definida");
    return null;
  }

  const formattedPair = `${pair.slice(0, 3)}/${pair.slice(3)}`;

  const url = [
    "https://api.marketaux.com/v1/news/all",
    `?symbols=${formattedPair}`,
    `&filter_entities=true`,
    `&language=en`,
    `&limit=5`,
    `&api_token=${apiKey}`,
  ].join("");

  try {
    console.log(`MarketAux: Fazendo request para ${pair}...`);
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`MarketAux HTTP ${res.status}`);
      if (newsCache[pair]) return newsCache[pair].data;
      return null;
    }

    const data = await res.json();

    if (!data?.data || data.data.length === 0) {
      console.warn(`MarketAux: Sem artigos para ${pair}`);
      const fallback: MarketAuxResult = {
        summary: "Sem noticias fundamentais recentes disponiveis.",
        sentiment: "neutral",
        headlines: [],
      };
      newsCache[pair] = { data: fallback, timestamp: now };
      return fallback;
    }

    const articles = data.data.slice(0, 5);
    const headlines: string[] = articles
      .map((a: any) => a.title as string)
      .filter(Boolean);

    let bullishCount = 0;
    let bearishCount = 0;
    articles.forEach((article: any) => {
      (article.entities ?? []).forEach((e: any) => {
        if (e.sentiment_score > 0.2)  bullishCount++;
        if (e.sentiment_score < -0.2) bearishCount++;
      });
    });

    const sentiment: "bullish" | "bearish" | "neutral" =
      bullishCount > bearishCount ? "bullish"
      : bearishCount > bullishCount ? "bearish"
      : "neutral";

    const summary = headlines.slice(0, 3).join(" | ") || "Sem resumo disponivel.";

    const result: MarketAuxResult = { summary, sentiment, headlines };
    newsCache[pair] = { data: result, timestamp: now };

    console.log(`MarketAux: ${pair} atualizado — sentimento: ${sentiment} (${headlines.length} artigos)`);
    return result;

  } catch (error) {
    console.error("MarketAux error:", error);
    if (newsCache[pair]) return newsCache[pair].data;
    return null;
  }
}
