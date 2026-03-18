"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { saveBot24Request } from "@/lib/saveBot24Request";
import { saveBot24History } from "@/lib/saveBot24History";
import { useLoader } from "@/context/LoaderContext";
import { Brain, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

const FIXED_PAIR = "EURUSD";
const TIMEFRAMES  = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

function ResultCard({
  data,
  capital,
  risk,
  xmLink,
  isAI = false,
}: {
  data: any;
  capital: number;
  risk: number;
  xmLink: string;
  isAI?: boolean;
}) {
  if (!data) return null;
  const isBuy = data.signal === "BUY";

  return (
    <div
      className={`relative rounded-2xl p-8 space-y-6 backdrop-blur overflow-hidden ${
        isAI
          ? "bg-gray-900/70 border border-[#00FFB2]/30"
          : "bg-gray-900/70 border border-gray-700"
      }`}
    >
      {isAI && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FFB2]/5 via-transparent to-[#00C2FF]/5 pointer-events-none" />
      )}

      <div className="relative flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {isAI ? (
            <div className="flex items-center gap-2 bg-[#00FFB2]/10 border border-[#00FFB2]/30 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3 text-[#00FFB2]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00FFB2]">
                1.5 flash
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600 px-3 py-1.5 rounded-full">
              <Brain className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                Sua Análise
              </span>
            </div>
          )}
          <h2 className="text-xl font-bold text-white">
            {isAI ? "Melhor Opção" : "Resultado da Análise"}
          </h2>
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border ${
            isAI
              ? "bg-[#00FFB2]/10 border-[#00FFB2]/20 text-[#00FFB2]"
              : "bg-gray-800 border-gray-700 text-gray-400"
          }`}
        >
          {data.suggestedTimeframe}
          {isAI && " · Ótimo"}
        </span>
      </div>

      {isAI && data.reasoning && (
        <div className="relative bg-[#00FFB2]/5 border border-[#00FFB2]/20 p-4 rounded-xl">
          <p className="text-[10px] text-[#00FFB2]/80 uppercase tracking-wider mb-1 font-bold">
            Raciocínio da IA
          </p>
          <p className="text-sm text-gray-300 italic leading-relaxed">{data.reasoning}</p>
        </div>
      )}

      <div className="relative grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Par",         value: data.pair,       color: "text-white" },
          { label: "Sinal",       value: data.signal,     color: isBuy ? "text-green-400" : "text-red-400" },
          { label: "Confiança",   value: `${data.confidence}%`, color: isAI ? "text-[#00FFB2]" : "text-white" },
          { label: "Entry Price", value: data.entry,      color: "text-blue-400" },
          { label: "Stop Loss",   value: data.stopLoss,   color: "text-red-400" },
          { label: "Take Profit", value: data.takeProfit, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`p-4 rounded-xl border ${
              isAI
                ? "bg-gray-800/60 border-[#00FFB2]/10"
                : "bg-gray-800/80 border-gray-700"
            }`}
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {isAI && (
        <div className="relative">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
              Nível de Confiança
            </span>
            <span className="text-sm font-black text-[#00FFB2]">{data.confidence}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FFB2] to-[#00C2FF] rounded-full transition-all duration-1000"
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>
      )}

      <div className="relative grid sm:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isAI
              ? "bg-[#00FFB2]/5 border-[#00FFB2]/20"
              : "bg-green-500/10 border-green-500/20"
          }`}
        >
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lucro Potencial</p>
          <p className={`text-3xl font-bold ${isAI ? "text-[#00FFB2]" : "text-green-400"}`}>
            ${data.profitPotential}
          </p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk / Reward</p>
          <p className="text-3xl font-bold text-white">1:{data.riskReward}</p>
        </div>
      </div>

      {data.marketAuxSummary &&
        data.marketAuxSummary !== "Sem dados fundamentais recentes." && (
          <div className="relative bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Contexto Fundamental
            </p>
            <p className="text-sm text-gray-300">{data.marketAuxSummary}</p>
          </div>
        )}

      <div
        className={`relative text-xs px-4 py-3 rounded-xl border ${
          isAI
            ? "bg-[#00FFB2]/5 border-[#00FFB2]/10 text-[#00FFB2]/80"
            : "bg-gray-800/50 border-gray-700 text-gray-400"
        }`}
      >
        SGT: {data.riskSuggestion}
      </div>

      <a
        href={xmLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
          isBuy
            ? isAI
              ? "bg-[#00FFB2] hover:bg-[#00e0a1] text-black shadow-[0_0_20px_rgba(0,255,178,0.3)]"
              : "bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            : "bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
        }`}
      >
        {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        Criar ordem {data.signal} na XM
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

export default function Bot24Analyze() {
  const { startLoading, stopLoading } = useLoader();
  const supabase = useMemo(() => createClient(), []);

  const [capital,       setCapital]       = useState(1000);
  const [timeframe,     setTimeframe]     = useState("H1");
  const [traderLevel,   setTraderLevel]   = useState("beginner");
  const [risk,          setRisk]          = useState(2);
  const [result,        setResult]        = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: countData } = await supabase.rpc(
          "get_daily_analysis_count", { user_uuid: user.id }
        );
        setAnalysisCount(countData || 0);

        // ✅ Carrega capital e risco do perfil guardado
        const { data: profile } = await supabase
          .from("trading_profiles")
          .select("trader_level, capital, risk_percent")
          .eq("user_id", user.id)
          .single();

        if (profile?.trader_level) setTraderLevel(profile.trader_level);
        if (profile?.capital)      setCapital(profile.capital);
        if (profile?.risk_percent) setRisk(profile.risk_percent);
      } catch (err) {
        console.error("loadStats error:", err);
      }
    }
    loadStats();
  }, [supabase]);

  async function handleAnalyze() {
    if (isAnalyzing)        return;
    if (analysisCount >= 10) {
      setErrorMsg("Limite diário de 10 análises atingido.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    startLoading();

    try {
      await saveBot24Request({
        pair:         FIXED_PAIR,
        timeframe,
        capital,
        risk_percent: risk,
        trader_level: traderLevel,
      });

      const response = await fetch("/api/bot24/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pair: FIXED_PAIR,
          capital,
          timeframe,
          traderLevel,
          risk,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro na análise");
      }

      const analysis = await response.json();

      // ✅ Passa _capital e _risk para atualizar trading_profiles
      await saveBot24History({ ...analysis, _capital: capital, _risk: risk });
      setResult(analysis);

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

  const xmLink =
    traderLevel === "beginner" ? XM_LINKS.beginner : XM_LINKS.advanced;

  return (
    <div className="relative min-h-screen">
      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      <div className="relative max-w-6xl mx-auto space-y-10 py-10 px-4">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Image src="/bot24_an.svg" alt="Bot24" width={60} height={60} />
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight">
              BOT24{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#00FFB2] via-[#00C2FF] to-[#00FFB2] bg-clip-text text-transparent animate-gradient-x">
                  ANALYSIS
                </span>
                <span className="absolute inset-0 bg-[#00FFB2]/15 blur-2xl -z-10 pointer-events-none" />
              </span>
            </h1>
            <p className="text-gray-400">
              Inteligência de mercado automatizada baseada no Gemini 1.5 flash
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#00FFB2]/10 border border-[#00FFB2]/30 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 bg-[#00FFB2] rounded-full animate-pulse" />
            <span className="text-[#00FFB2] font-black text-sm tracking-wider">
              EUR / USD
            </span>
            <span className="text-[10px] text-[#00FFB2]/60 uppercase tracking-widest font-bold">
              · Most Liquid Pair
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-lg text-sm text-white">
            Análises hoje:
            <span
              className={`font-bold ${
                analysisCount >= 10 ? "text-red-400" : "text-green-400"
              }`}
            >
              {analysisCount} / 10
            </span>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6 backdrop-blur">
          <h2 className="text-lg font-bold text-white">Configurar Análise</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition"
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t} value={t} className="bg-gray-800">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Capital ($)
              </label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition placeholder-gray-600"
                placeholder="Ex: 100"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Risco (%)
              </label>
              <input
                type="number"
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-green-500 transition placeholder-gray-600"
                placeholder="Ex: 2"
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>
          </div>

          {/* Info cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-gray-800/40 border border-gray-700/50 p-3 rounded-xl">
              <Brain className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Análise Padrão</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Com base no teu timeframe e risco definidos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#00FFB2]/5 border border-[#00FFB2]/20 p-3 rounded-xl">
              <Sparkles className="w-4 h-4 text-[#00FFB2] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#00FFB2]">Sugestão 1.5 flash</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  IA escolhe o timeframe e risco ótimos com alta precisão
                </p>
              </div>
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                A analisar EUR/USD...
              </span>
            ) : analysisCount >= 10 ? (
              "Limite Atingido"
            ) : (
              "▶ Iniciar Análise"
            )}
          </button>
        </div>

        {/* Resultados */}
        {result && (
          <div className="space-y-6">
            <ResultCard
              data={result}
              capital={capital}
              risk={risk}
              xmLink={xmLink}
              isAI={false}
            />
            {result.aiSuggestion && (
              <ResultCard
                data={result.aiSuggestion}
                capital={capital}
                risk={risk}
                xmLink={xmLink}
                isAI={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
