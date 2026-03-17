import { fetchAlphaVantageData } from "./alphaVantageClient";
import { fetchMarketAuxData } from "./marketAuxClient";
import { runLiveSignalAnalysis } from "./bot24Analysis";
import { saveBot24HistoryServer, saveLiveSignal } from "./saveBot24HistoryServer";
import { runQuantEngine } from "./bot24QuantEngine";
import { isForexMarketOpen, getCurrentSession } from "./marketAnalysis";

// ─── Configuração ─────────────────────────────────────────────────────────────

const PAIR         = "EURUSD";   // ✅ Foco único em EUR/USD
const CAPITAL      = 1000;
const TRADER_LEVEL = "intermediate";

// Timeframes para geração de live signals por hora
const LIVE_SIGNAL_TIMEFRAMES = ["M5", "M15", "H1", "H4"] as const;

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Executa a cada hora (via cron).
 * Arquitetura:
 *   1. Verifica se o mercado está aberto (não desperdiça requests no fim-de-semana)
 *   2. Busca dados Alpha Vantage UMA VEZ (cache 1h)
 *   3. Busca dados MarketAux UMA VEZ (cache 1h)
 *   4. Gera live signals para 4 timeframes em paralelo (4 calls Gemini)
 *   5. Salva tudo no Supabase
 *   6. Atualiza rankings do QuantEngine
 */
export async function runGeminiScheduler() {
  console.log("🤖 Scheduler iniciado:", new Date().toISOString());

  // ── 1. Verifica se o mercado está aberto ──────────────────────────────────
  if (!isForexMarketOpen()) {
    const session = getCurrentSession();
    console.log(`⏸️  Mercado fechado (${session}) — scheduler ignorado para poupar requests.`);
    return { skipped: true, reason: "market_closed" };
  }

  const session = getCurrentSession();
  console.log(`📊 Sessão ativa: ${session}`);

  // ── 2. Fetch de dados UMA VEZ para todos os timeframes ────────────────────
  console.log(`📡 A buscar dados para ${PAIR}...`);
  const [alphaData, marketAuxData] = await Promise.all([
    fetchAlphaVantageData(PAIR),
    fetchMarketAuxData(PAIR),
  ]);

  if (!alphaData) {
    console.error("❌ Falha ao obter dados Alpha Vantage — abortando scheduler.");
    return { success: false, reason: "alpha_vantage_failed" };
  }

  console.log(
    `✅ Dados obtidos — preço: ${alphaData.latestPrice}, ` +
    `tendência: ${alphaData.marketContext.trend} (${alphaData.marketContext.trendStrength}), ` +
    `sessão: ${alphaData.marketContext.activeSession}`
  );

  // ── 3. Gera live signals para todos os timeframes em paralelo ─────────────
  console.log(`🔄 Gerando sinais para timeframes: ${LIVE_SIGNAL_TIMEFRAMES.join(", ")}...`);

  const signalResults = await Promise.allSettled(
    LIVE_SIGNAL_TIMEFRAMES.map((tf) =>
      runLiveSignalAnalysis(PAIR, tf, CAPITAL, TRADER_LEVEL, alphaData, marketAuxData)
    )
  );

  // ── 4. Salva resultados ───────────────────────────────────────────────────
  let savedCount   = 0;
  let failedCount  = 0;

  for (let i = 0; i < signalResults.length; i++) {
    const tf     = LIVE_SIGNAL_TIMEFRAMES[i];
    const result = signalResults[i];

    if (result.status === "fulfilled") {
      const signal = result.value;

      // Salva em live_signals
      const { success: lsOk, error: lsErr } = await saveLiveSignal(signal);

      // Salva em bot24_history (apenas H1 como referência principal)
      if (tf === "H1") {
        const { success: histOk } = await saveBot24HistoryServer(signal);
        if (!histOk) console.warn(`⚠️  Falha ao salvar H1 no histórico`);
      }

      if (lsOk) {
        savedCount++;
        console.log(`  ✅ ${PAIR} ${tf}: ${signal.signal} (${signal.confidence}%)`);
      } else {
        failedCount++;
        console.error(`  ❌ ${PAIR} ${tf} — erro ao salvar: ${lsErr}`);
      }
    } else {
      failedCount++;
      console.error(`  ❌ ${PAIR} ${tf} — erro na análise:`, result.reason);
    }

    // Pequeno delay entre saves para não sobrecarregar o Supabase
    if (i < signalResults.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`📈 Sinais: ${savedCount} guardados, ${failedCount} falhados`);

  // ── 5. Atualiza QuantEngine ───────────────────────────────────────────────
  try {
    const quantResult = await runQuantEngine();
    console.log("🧮 QuantEngine atualizado:", quantResult);
  } catch (err) {
    console.error("❌ Erro no QuantEngine:", err);
  }

  const summary = {
    success: true,
    pair: PAIR,
    session,
    timeframes: LIVE_SIGNAL_TIMEFRAMES,
    saved: savedCount,
    failed: failedCount,
    timestamp: new Date().toISOString(),
  };

  console.log("✅ Scheduler finalizado:", summary);
  return summary;
}
