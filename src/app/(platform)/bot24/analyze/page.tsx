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

      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      await saveBot24Request({
        pair,
        timeframe,
        capital,
        risk_percent: risk
      });

      const analysis = await runBot24Analysis({
        pair,
        capital,
        timeframe,
        traderLevel,
        risk
      });

      await saveBot24History(analysis);

      setResult(analysis);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase.rpc("get_daily_analysis_count", {
          user_uuid: user.id,
        });
        setAnalysisCount(data || 0);
      }

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  const getXMButtonLink = () => {
    if (traderLevel === "beginner") return XM_LINKS.beginner;
    return XM_LINKS.advanced;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* HEADER COM LOGO BOT24 OTIMIZADO */}
      <div className="flex items-center gap-5">
        <Image 
          src="/bot24.svg" 
          alt="Bot24 Logo" 
          width={64} 
          height={64} 
          className="drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
        />
        <div>
          <h1 className="text-4xl font-bold">
            Bot24 AI Analysis
          </h1>
          <p className="text-gray-400 mt-1">
            Gere uma análise profissional com IA baseada em dados de mercado e gestão de risco.
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-2 gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700">

        <input
          placeholder="Pair (EURUSD, BTCUSD...)"
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className="bg-gray-900 p-3 rounded"
        />

        <input
          type="number"
          min="5"
          step="5"
          placeholder="Capital"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
          className="bg-gray-900 p-3 rounded"
        />

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-900 p-3 rounded"
        >
          <option value="M5">M5</option>
          <option value="M15">M15</option>
          <option value="M30">M30</option>
          <option value="H1">H1</option>
          <option value="H4">H4</option>
          <option value="D1">D1</option>
          <option value="W1">W1</option>
        </select>

        <select
          value={traderLevel}
          onChange={(e) => setTraderLevel(e.target.value)}
          className="bg-gray-900 p-3 rounded"
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
          className="bg-gray-900 p-3 rounded"
        />

      </div>

      <button
        onClick={handleAnalyze}
        className="bg-green-500 hover:bg-green-600 transition px-8 py-3 rounded-lg font-semibold"
      >
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {/* RESULT */}
      {result && (
        <div className="relative overflow-hidden bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
          
          {/* MARCA D'ÁGUA OTIMIZADA */}
          <Image 
            src="/bot24.svg" 
            alt="" 
            width={320} 
            height={320} 
            className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none select-none" 
          />

          <h2 className="text-2xl font-bold relative z-10">
            Bot24 Analysis Result
          </h2>

          {/* CORE SIGNAL */}
          <div className="grid grid-cols-2 gap-4 relative z-10">

            <p><strong>Pair:</strong> {result.pair}</p>

            <p>
              <strong>Signal:</strong>{" "}
              <span className={
                result.signal === "BUY"
                  ? "text-green-400 font-bold"
                  : "text-red-400 font-bold"
              }>
                {result.signal}
              </span>
            </p>

            <p><strong>Confidence:</strong> {result.confidence}</p>

            <p><strong>Bot24 Score:</strong> {result.score || "8.2 / 10"}</p>

          </div>

          {/* TRADE SETUP */}
          <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 space-y-2 relative z-10">

            <h3 className="font-semibold text-lg">
              Trade Setup
            </h3>

            <p><strong>Entry Price:</strong> {result.entry || "Auto-calculated by Bot24"}</p>

            <p className="text-red-400">
              <strong>Stop Loss:</strong> {result.stopLoss || "Auto-calculated"}
            </p>

            <p className="text-green-400">
              <strong>Take Profit:</strong> {result.takeProfit || "Auto-calculated"}
            </p>

            <p>
              <strong>Risk / Reward:</strong> {result.riskReward || "1 : 2"}
            </p>

          </div>

          {/* EXPLANATION */}
          <div className="text-gray-400 space-y-2 relative z-10">

            <p>
              <strong>Stop Loss:</strong> nível onde a operação fecha automaticamente
              caso o mercado vá contra você, limitando o prejuízo.
            </p>

            <p>
              <strong>Take Profit:</strong> nível onde a operação fecha automaticamente
              garantindo o lucro quando o mercado atingir o alvo.
            </p>

          </div>

          {/* MARKET INSIGHT */}
          <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 relative z-10">

            <h3 className="font-semibold mb-2">
              Bot24 Market Insight
            </h3>

            <p className="text-gray-400">
              {result.marketAuxSummary}
            </p>

          </div>

          {/* MARKET INTELLIGENCE */}
          <div className="space-y-4 relative z-10">
            <h3 className="font-semibold text-lg">Market Intelligence</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Trend</span>
                <div className="text-xl font-bold">{result.trend}</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Momentum</span>
                <div className="text-xl font-bold">{result.momentum}</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Volatility</span>
                <div className="text-xl font-bold">{result.volatility}</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Liquidity</span>
                <div className="text-xl font-bold">{result.liquidity}</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Probability</span>
                <div className="text-xl font-bold">{result.probability}%</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <span className="text-gray-400 text-sm">Market Score</span>
                <div className="text-xl font-bold text-green-400">
                  {result.marketScore}
                </div>
              </div>

            </div>
          </div>

          {/* CTA XM */}
          <a
            href={getXMButtonLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition transform hover:scale-105"
          >
            {traderLevel === "beginner"
              ? "Abrir XM Demo"
              : "Abrir XM Real / Educação"}
          </a>

        </div>

      )}

    </div>
  );
}