"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { saveBot24Request } from "@/lib/saveBot24Request";
import { saveBot24History } from "@/lib/saveBot24History";
import { useLoader } from "@/context/LoaderContext";

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

const TOP_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD",
  "USDCAD", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY",
  "AUDJPY", "AUDNZD", "EURCHF", "EURAUD", "GBPCHF",
  "USDSEK", "USDNOK", "USDTRY", "USDMXN", "EURCAD",
];

const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4","D1","W1"];

export default function Bot24Analyze() {
  const { startLoading, stopLoading } = useLoader();

  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [pair, setPair] = useState("");
  const [capital, setCapital] = useState(1000);
  const [timeframe, setTimeframe] = useState("H1");
  const [traderLevel, setTraderLevel] = useState("beginner");
  const [risk, setRisk] = useState(2);
  const [result, setResult] = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: countData } = await supabase.rpc(
          "get_daily_analysis_count", { user_uuid: user.id }
        );
        setAnalysisCount(countData || 0);

        const { data: profile } = await supabase
          .from("users")
          .select("trader_level")
          .eq("id", user.id)
          .single();
        if (profile?.trader_level) setTraderLevel(profile.trader_level);
      } catch (err) {
        console.error("loadStats error:", err);
      }
    }
    loadStats();
  }, [supabase]);

  async function handleAnalyze() {
    if (!pair.trim()) { setErrorMsg("Selecione um par de moedas."); return; }
    if (isAnalyzing) return;
    if (analysisCount >= 10) { setErrorMsg("Limite diário de 10 análises atingido."); return; }

    setErrorMsg(null);
    setIsAnalyzing(true);
    startLoading();

    try {
      // 1. Salva request (client-side, tem sessão)
      await saveBot24Request({ pair, timeframe, capital, risk_percent: risk, trader_level: traderLevel });

      // 2. ✅ Análise via API route server-side (chaves secretas nunca expostas ao cliente)
      const response = await fetch("/api/bot24/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, capital, timeframe, traderLevel, risk }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro na análise");
      }

      const analysis = await response.json();

      // 3. Salva histórico (client-side, tem sessão)
      await saveBot24History(analysis);
      setResult(analysis);

      // 4. Atualiza contador
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: countData } = await supabase.rpc(
          "get_daily_analysis_count", { user_uuid: user.id }
        );
        setAnalysisCount(countData || 0);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro ao gerar análise. Tente novamente.");
    } finally {
      stopLoading();
      setIsAnalyzing(false);
    }
  }

  const getXMButtonLink = () => {
    const base = traderLevel === "beginner" ? XM_LINKS.beginner : XM_LINKS.advanced;
    return result?.pair ? `${base}&symbol=${result.pair}` : base;
  };

  const calculateProfit = () => {
    if (!result) return "0.00";
    return (capital * (risk / 100) * 2).toFixed(2);
  };

  return (
    <div className="relative min-h-screen">
      <Image src="/hero-b.webp" alt="Background" fill priority className="object-cover opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      <div className="relative max-w-6xl mx-auto space-y-10 py-10 px-4">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Image src="/bot24_an.svg" alt="Bot24" width={60} height={60} />
          <div>
            <h1 className="text-4xl font-bold text-white">Bot24 Analysis</h1>
            <p className="text-gray-400">Inteligência de mercado automatizada baseada em IA</p>
          </div>
        </div>

        {/* Daily counter */}
        <div className="inline-flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-lg text-sm text-white">
          Análises hoje:
          <span className={`font-bold ${analysisCount >= 10 ? "text-red-400" : "text-green-400"}`}>
            {analysisCount} / 10
          </span>
        </div>

        {/* Form */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6 backdrop-blur">
          <h2 className="text-lg font-bold text-white">Configurar Análise</h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Par</label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition"
              >
                <option value="">Selecionar Par</option>
                {TOP_PAIRS.map((p) => (
                  <option key={p} value={p} className="bg-gray-800">{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition"
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t} value={t} className="bg-gray-800">{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Capital ($)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition placeholder-gray-600"
                placeholder="Ex: 1000"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Risco (%)</label>
              <input
                type="number"
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition placeholder-gray-600"
                placeholder="Ex: 2"
                min={0.1}
                max={100}
                step={0.1}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || analysisCount >= 10}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 ${
              isAnalyzing || analysisCount >= 10
                ? "bg-gray-700 cursor-not-allowed opacity-60"
                : "bg-green-500 hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analisando...
              </span>
            ) : analysisCount >= 10 ? "Limite Atingido" : "▶ Executar Análise IA"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-gray-900/70 border border-gray-700 rounded-2xl p-8 space-y-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">Resultado da Análise</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Par", value: result.pair, color: "text-white" },
                {
                  label: "Sinal",
                  value: result.signal,
                  color: result.signal === "BUY" ? "text-green-400" : "text-red-400",
                },
                { label: "Confiança", value: `${result.confidence}%`, color: "text-white" },
                { label: "Entry Price", value: result.entry, color: "text-blue-400" },
                { label: "Stop Loss", value: result.stopLoss, color: "text-red-400" },
                { label: "Take Profit", value: result.takeProfit, color: "text-green-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lucro Potencial (RR 1:2)</p>
                <p className="text-3xl font-bold text-green-400">${calculateProfit()}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk / Reward</p>
                <p className="text-3xl font-bold text-white">1:{result.riskReward}</p>
              </div>
            </div>

            {result.marketAuxSummary && (
              <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Contexto Fundamental</p>
                <p className="text-sm text-gray-300">{result.marketAuxSummary}</p>
              </div>
            )}

            <a
              href={getXMButtonLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                result.signal === "BUY"
                  ? "bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  : "bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              }`}
            >
              Criar ordem {result.signal} na XM
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
