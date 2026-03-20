export type MarketAuxResult = {
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  headlines: string[];
} | null;

const newsCache: Record<string, { data: MarketAuxResult; timestamp: number }> = {};
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

/**
 * MarketAux — 100 requests/dia no plano gratuito.
 * CORRIGIDO: usa keywords em vez de symbols (que sao para acoes).
 * Para Forex o correcto e pesquisar por "EUR USD" como termo de pesquisa.
 * Cache de 12h — max 2 requests/dia, bem dentro do limite.
 */
export async function fetchMarketAuxData(pair: string): Promise<MarketAuxResult> {
  const now = Date.now();

  if (newsCache[pair] && now - newsCache[pair].timestamp < TWELVE_HOURS) {
    const remaining = Math.round((TWELVE_HOURS - (now - newsCache[pair].timestamp)) / 3_600_000);
    console.log(`MarketAux: Cache hit para ${pair} (expira em ${remaining}h)`);
    return newsCache[pair].data;
  }

  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) {
    console.warn("MARKETAUX_API_KEY nao definida");
    return null;
  }

  // ✅ CORRIGIDO: keywords em vez de symbols
  // MarketAux symbols sao para acoes (TSLA, AAPL) — nao para pares Forex
  // Para EURUSD pesquisamos: "euro dollar", "EUR USD", "ECB", "Federal Reserve"
  const from  = pair.slice(0, 3); // EUR
  const to    = pair.slice(3);    // USD
  const query = encodeURIComponent(`${from} ${to} forex`);

  const url = [
    "https://api.marketaux.com/v1/news/all",
    `?search=${query}`,
    `&language=en`,
    `&limit=5`,
    `&published_after=${getYesterdayISO()}`,
    `&api_token=${apiKey}`,
  ].join("");

  try {
    console.log(`MarketAux: A buscar noticias para ${pair} (keywords: ${from} ${to} forex)...`);
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`MarketAux HTTP ${res.status}`);
      if (newsCache[pair]) return newsCache[pair].data;
      return null;
    }

    const data = await res.json();

    // Detecta limite esgotado
    if (data?.error) {
      console.error("MarketAux erro:", data.error?.message ?? JSON.stringify(data.error).slice(0, 150));
      if (newsCache[pair]) return newsCache[pair].data;
      return null;
    }

    if (!data?.data || data.data.length === 0) {
      console.warn(`MarketAux: Sem artigos para ${pair} — a tentar sem filtro de data`);

      // Segunda tentativa sem filtro de data
      const urlFallback = [
        "https://api.marketaux.com/v1/news/all",
        `?search=${query}`,
        `&language=en`,
        `&limit=3`,
        `&api_token=${apiKey}`,
      ].join("");

      const res2   = await fetch(urlFallback, { cache: "no-store" });
      const data2  = await res2.json();

      if (!data2?.data || data2.data.length === 0) {
        const fallback: MarketAuxResult = {
          summary:   "Sem noticias fundamentais recentes disponiveis.",
          sentiment: "neutral",
          headlines: [],
        };
        newsCache[pair] = { data: fallback, timestamp: now };
        return fallback;
      }

      return processArticles(data2.data, pair, now);
    }

    return processArticles(data.data, pair, now);

  } catch (error) {
    console.error("MarketAux error:", error);
    if (newsCache[pair]) return newsCache[pair].data;
    return null;
  }
}

function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0] + "T00:00:00";
}

function processArticles(
  articles: any[],
  pair: string,
  now: number
): MarketAuxResult {
  const headlines: string[] = articles
    .map((a: any) => a.title as string)
    .filter(Boolean)
    .slice(0, 5);

  // Calcula sentimento agregado de todas as entidades nos artigos
  let bullishScore = 0;
  let bearishScore = 0;

  articles.forEach((article: any) => {
    // Sentimento das entidades identificadas no artigo
    (article.entities ?? []).forEach((e: any) => {
      if (e.sentiment_score >  0.2) bullishScore += e.sentiment_score;
      if (e.sentiment_score < -0.2) bearishScore += Math.abs(e.sentiment_score);
    });

    // Fallback: usa o titulo para detectar palavras-chave
    const title = (article.title ?? "").toLowerCase();
    if (/rise|surge|rally|bullish|strong|gain|up/.test(title))   bullishScore += 0.5;
    if (/fall|drop|decline|bearish|weak|loss|down/.test(title))  bearishScore += 0.5;
  });

  const sentiment: "bullish" | "bearish" | "neutral" =
    bullishScore > bearishScore + 0.5 ? "bullish"
    : bearishScore > bullishScore + 0.5 ? "bearish"
    : "neutral";

  const summary = headlines.slice(0, 3).join(" | ") || "Sem resumo disponivel.";

  const result: MarketAuxResult = { summary, sentiment, headlines };
  newsCache[pair] = { data: result, timestamp: now };

  console.log(`MarketAux: ${pair} atualizado — sentimento: ${sentiment} (${headlines.length} artigos)`);
  return result;
}
