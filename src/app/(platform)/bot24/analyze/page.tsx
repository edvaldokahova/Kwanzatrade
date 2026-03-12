"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24Request } from "@/lib/saveBot24Request";
import { saveBot24History } from "@/lib/saveBot24History";

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

export default function Bot24Analyze() {
  const [pair, setPair] = useState("");
  const [capital, setCapital] = useState(100);
  const [timeframe, setTimeframe] = useState("H1");
  const [traderLevel, setTraderLevel] = useState("beginner");
  const [risk, setRisk] = useState(2);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);

  useEffect(() => {
    async function fetchDailyCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc("get_daily_analysis_count", {
        user_uuid: user.id,
      });
      setAnalysisCount(data || 0);

      const { data: profile } = await supabase
        .from("users")
        .select("trader_level")
        .eq("id", user.id)
        .single();

      if (profile?.trader_level) {
        setTraderLevel(profile.trader_level);
      }
    }
    fetchDailyCount();
  }, []);

  async function handleAnalyze() {
    if (!pair.trim()) return;

    if (analysisCount >= 10) {
      alert("Você atingiu o limite diário de 10 análises. Volte amanhã!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Salva o registro da solicitação
      await saveBot24Request({
        pair,
        timeframe,
        capital,
        risk_percent: risk,
        trader_level: traderLevel
      });

      // 2. Executa a análise lógica (com cache de 60min interno)
      const analysis = await runBot24Analysis({
        pair,
        capital,
        timeframe,
        traderLevel,
        risk
      });

      // 3. Salva o resultado final no histórico
      await saveBot24History(analysis);

      setResult(analysis);

      // 4. Atualiza o contador diário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc("get_daily_analysis_count", {
          user_uuid: user.id,
        });
        setAnalysisCount(data || 0);
      }
    } catch (error) {
      console.error("Erro durante a análise do Bot24:", error);
      alert("Ocorreu um erro ao processar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const getXMButtonLink = () => {
    if (traderLevel === "beginner") return XM_LINKS.beginner;
    return XM_LINKS.advanced;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-5">
        <Image 
          src="/bot24.svg" 
          alt="Bot24 Logo" 
          width={64} 
          height={64} 
          className="drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
        />
        <div>
          <h1 className="text-4xl font-bold">Bot24 AI Analysis</h1>
          <p className="text-gray-400 mt-1">
            Gere uma análise profissional com IA baseada em dados de mercado e gestão de risco.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <input
          placeholder="Pair (EURUSD, BTCUSD...)"
          value={pair}
          onChange={(e) => setPair(e.target.value.toUpperCase())}
          className="bg-gray-900 p-3 rounded outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="number"
          min="5"
          placeholder="Capital"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
          className="bg-gray-900 p-3 rounded outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-900 p-3 rounded outline-none focus:ring-2 focus:ring-green-500"
        >
          {["M5", "M15", "M30", "H1", "H4", "D1", "W1"].map(tf => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>

        <select
          value={traderLevel}
          onChange={(e) => setTraderLevel(e.target.value)}
          className="bg-gray-900 p-3 rounded outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="beginner">Iniciante</option>
          <option value="intermediate">Intermediário</option>
          <option value="advanced">Avançado</option>
        </select>

        <input
          type="number"
          min="0.5"
          max="10"
          step="0.5"
          placeholder="Risk %"
          value={risk}
          onChange={(e) => setRisk(Number(e.target.value))}
          className="bg-gray-900 p-3 rounded outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 transition px-8 py-3 rounded-lg font-semibold w-full md:w-auto"
      >
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {result && (
        <div className="relative overflow-hidden bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
          <Image 
            src="/bot24.svg" 
            alt="" 
            width={320} 
            height={320} 
            className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none select-none" 
          />

          <h2 className="text-2xl font-bold relative z-10">Bot24 Analysis Result</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <p><strong>Pair:</strong> {result.pair}</p>
            <p>
              <strong>Signal:</strong>{" "}
              <span className={result.signal === "BUY" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                {result.signal}
              </span>
            </p>
            <p><strong>Confidence:</strong> {result.confidence}%</p>
            <p><strong>Bot24 Score:</strong> {result.score || "8.2 / 10"}</p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 space-y-2 relative z-10">
            <h3 className="font-semibold text-lg">Trade Setup</h3>
            <p><strong>Entry Price:</strong> {result.entry}</p>
            <p className="text-red-400"><strong>Stop Loss:</strong> {result.stopLoss}</p>
            <p className="text-green-400"><strong>Take Profit:</strong> {result.takeProfit}</p>
            <p><strong>Risk / Reward:</strong> {result.riskReward}</p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 relative z-10">
            <h3 className="font-semibold mb-2">Bot24 Market Insight</h3>
            <p className="text-gray-400">{result.marketAuxSummary}</p>
          </div>

          <div className="space-y-4 relative z-10">
            <h3 className="font-semibold text-lg">Market Intelligence</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Trend", value: result.trend },
                { label: "Momentum", value: result.momentum },
                { label: "Volatility", value: result.volatility },
                { label: "Liquidity", value: result.liquidity },
                { label: "Probability", value: `${result.probability}%` },
                { label: "Market Score", value: result.marketScore, color: "text-green-400" }
              ].map((item, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded border border-gray-700">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <div className={`text-xl font-bold ${item.color || ""}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <a
            href={getXMButtonLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition transform hover:scale-105"
          >
            {traderLevel === "beginner" ? "Abrir XM Demo" : "Abrir XM Real / Educação"}
          </a>
        </div>
      )}
    </div>
  );
}
