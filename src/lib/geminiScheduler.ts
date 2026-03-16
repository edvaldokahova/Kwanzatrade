import { runBot24Analysis } from "./bot24Analysis";
import { saveBot24HistoryServer } from "./saveBot24HistoryServer";
import { runQuantEngine } from "./bot24QuantEngine";

const PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
  "USDCAD", "USDCHF", "NZDUSD", "EURGBP",
  "EURJPY", "GBPJPY", "AUDJPY", "EURCAD",
  "USDMXN", "USDTRY", "USDSEK",
];

const TRADER_LEVEL = "intermediate";
const CAPITAL = 1000;
const RISK = 1;

/**
 * Server-side only — chamada pelo cron route.
 * Analisa todos os pares e atualiza o QuantEngine.
 */
export async function runGeminiScheduler() {
  console.log("🤖 Gemini Scheduler iniciado:", new Date().toISOString());

  let successCount = 0;
  let errorCount = 0;

  for (const pair of PAIRS) {
    try {
      const result = await runBot24Analysis({
        pair,
        capital: CAPITAL,
        timeframe: "H1",
        traderLevel: TRADER_LEVEL,
        risk: RISK,
      });

      // ✅ Usa saveBot24HistoryServer (admin client, sem sessão de utilizador)
      const { success, error } = await saveBot24HistoryServer(result);

      if (success) {
        successCount++;
        console.log(`✅ ${pair} processado`);
      } else {
        console.error(`⚠️ ${pair} salvo com erro:`, error);
        errorCount++;
      }

      // Delay entre requests para não sobrecarregar APIs
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ Erro ao processar ${pair}:`, err);
      errorCount++;
    }
  }

  console.log(
    `📊 Scheduler: ${successCount} sucessos, ${errorCount} erros de ${PAIRS.length} pares`
  );

  // Atualiza rankings do Quant Engine
  try {
    const quantResult = await runQuantEngine();
    console.log("📈 Quant Engine atualizado:", quantResult);
  } catch (err) {
    console.error("❌ Erro ao atualizar Quant Engine:", err);
  }

  console.log("✅ Gemini Scheduler finalizado:", new Date().toISOString());
}
