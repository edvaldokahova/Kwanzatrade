import { runBot24Analysis } from "./bot24Analysis";
import { saveBot24History } from "./saveBot24History";
import { runQuantEngine } from "./bot24QuantEngine";

const PAIRS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "NZDUSD"
]; // Coloque todos os pares que você quer analisar automaticamente

const TRADER_LEVEL = "beginner";
const CAPITAL = 1000; // Valor base para os cálculos
const RISK = 1; // Percentual de risco default

export async function runGeminiScheduler() {
  console.log("Gemini Scheduler iniciado:", new Date().toISOString());

  for (const pair of PAIRS) {
    try {
      const result = await runBot24Analysis({
        pair,
        capital: CAPITAL,
        timeframe: "M5",
        traderLevel: TRADER_LEVEL,
        risk: RISK
      });

      await saveBot24History(result);

      console.log(`${pair} processado e salvo com sucesso.`);
    } catch (err) {
      console.error(`Erro ao processar ${pair}:`, err);
    }
  }

  // Atualiza rankings do Quant Engine
  try {
    const quantResult = await runQuantEngine();
    console.log("Quant Engine atualizado:", quantResult);
  } catch (err) {
    console.error("Erro ao atualizar Quant Engine:", err);
  }

  console.log("Gemini Scheduler finalizado:", new Date().toISOString());
}

// Opcional: rodar localmente a cada 1 hora
if (require.main === module) {
  runGeminiScheduler();
  setInterval(runGeminiScheduler, 60 * 60 * 1000); // 1 hora
}
