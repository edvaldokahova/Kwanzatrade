"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  Zap, TrendingUp, TrendingDown, Copy, Check,
  AlertTriangle, Clock, Flame, BarChart2,
} from "lucide-react";

const PAIRS = ["BTCUSDT", "ETHUSDT"];
const LEVERAGES = [5, 10, 20];

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string | number }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all ${
        copied
          ? "text-green-400 bg-green-400/15"
          : "text-gray-600 hover:text-gray-300 hover:bg-gray-700/50"
      }`}
      title={copied ? "Copiado!" : "Copiar"}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function SigmaResultCard({ data, capital }: { data: any; capital: number }) {
  if (!data) return null;

  const isLong     = data.signal === "LONG";
  const isNeutral  = data.signal === "NEUTRAL";
  const fearColor  =
    data.fearGreed >= 75 ? "text-red-400"    :
    data.fearGreed >= 55 ? "text-yellow-400" :
    data.fearGreed <= 25 ? "text-green-400"  :
    data.fearGreed <= 45 ? "text-blue-400"   : "text-gray-400";

  const leverageColor =
    data.leverage >= 20 ? "text-red-400"    :
    data.leverage >= 10 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="relative rounded-2xl p-8 space-y-6 backdrop-blur overflow-hidden bg-gray-900/70 border border-[#F7931A]/30">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7931A]/5 via-transparent to-[#627EEA]/5 pointer-events-none" />

      {/* Header do card */}
<div className="relative flex items-center justify-between flex-wrap gap-3">
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 bg-[#F7931A]/10 border border-[#F7931A]/30 px-3 py-1.5 rounded-full">
      <Zap className="w-3 h-3 text-[#F7931A]" />
      <span className="text-[10px] font-black uppercase tracking-widest text-[#F7931A]">
        SIGMA BOT
      </span>
    </div>
    <h2 className="text-xl font-bold text-white">{data.pair}</h2>
  </div>
  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border ${
    isLong    ? "bg-green-500/10 border-green-500/20 text-green-400" :
    isNeutral ? "bg-gray-800 border-gray-700 text-gray-400" :
                "bg-red-500/10 border-red-500/20 text-red-400"
  }`}>
    {data.signal}
  </span>
</div>

      {/* Reasoning */}
      {data.reasoning && (
        <div className="relative bg-[#F7931A]/5 border border-[#F7931A]/20 p-4 rounded-xl">
          <p className="text-[10px] text-[#F7931A]/80 uppercase tracking-wider mb-1 font-bold">
            Raciocínio SIGMA
          </p>
          <p className="text-sm text-gray-300 italic leading-relaxed">{data.reasoning}</p>
        </div>
      )}

      {/* Sinal + Confiança + Score */}
      <div className="relative grid grid-cols-3 gap-4">
        {[
          { label: "Sinal",     value: data.signal,          color: isLong ? "text-green-400" : isNeutral ? "text-gray-400" : "text-red-400" },
          { label: "Confianca", value: `${data.confidence}%`, color: "text-[#F7931A]" },
          { label: "Score",     value: data.score,            color: "text-white" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-gray-800/60 border border-[#F7931A]/10">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Nivel de Confianca</span>
          <span className="text-sm font-black text-[#F7931A]">{data.confidence}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F7931A] to-[#627EEA] rounded-full transition-all duration-1000"
            style={{ width: `${data.confidence}%` }}
          />
        </div>
      </div>

      {/* Entry, SL, TP com copy */}
      <div className="relative grid grid-cols-3 gap-4">
        {[
          { label: "Entry Price",  value: data.entry,     color: "text-blue-400" },
          { label: "Stop Loss",    value: data.stopLoss,  color: "text-red-400" },
          { label: "Take Profit",  value: data.takeProfit,color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-gray-800/60 border border-[#F7931A]/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
              <CopyButton value={value} />
            </div>
            <p className={`text-xl font-bold ${color}`}>
              ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Futures fields — exclusivos do SIGMA */}
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-800/60 border border-[#F7931A]/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Alavancagem</p>
          <div className="flex items-center justify-between">
            <p className={`text-2xl font-bold ${leverageColor}`}>{data.leverage}x</p>
            <CopyButton value={data.leverage} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Liquidacao</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-red-400">
              ${Number(data.liquidation).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <CopyButton value={data.liquidation} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-800/60 border border-[#F7931A]/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Margem</p>
          <p className="text-2xl font-bold text-white">${data.margin}</p>
          <p className="text-[9px] text-gray-600 mt-0.5">USDT necessario</p>
        </div>

        <div className="p-4 rounded-xl bg-gray-800/60 border border-[#F7931A]/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tamanho</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-white">{data.positionSize}</p>
            <CopyButton value={data.positionSize} />
          </div>
          <p className="text-[9px] text-gray-600 mt-0.5">
            {data.pair.replace("USDT", "")}
          </p>
        </div>
      </div>

      {/* RR + Lucro */}
      <div className="relative grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#F7931A]/5 border border-[#F7931A]/20">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lucro Potencial</p>
          <p className="text-3xl font-bold text-[#F7931A]">${data.profitPotential}</p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk / Reward</p>
          <p className="text-3xl font-bold text-white">1:{data.riskReward}</p>
        </div>
      </div>

      {/* Derivatives Intelligence */}
      <div className="relative grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-3 h-3 text-gray-400" />
            <p className="text-gray-400 text-xs uppercase tracking-wider">Funding Rate</p>
          </div>
          <p className={`text-xl font-bold ${
            data.fundingRate?.startsWith("+") ? "text-red-400" : "text-green-400"
          }`}>
            {data.fundingRate}
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">
            {data.fundingRate?.startsWith("+")
              ? "Maioria LONG — pressao SHORT"
              : "Maioria SHORT — pressao LONG"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-3 h-3 text-gray-400" />
            <p className="text-gray-400 text-xs uppercase tracking-wider">Fear & Greed</p>
          </div>
          <p className={`text-xl font-bold ${fearColor}`}>
            {data.fearGreed}/100
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">{data.fearGreedLabel}</p>
        </div>
      </div>

      {/* Aviso de liquidacao */}
      <div className="relative bg-red-500/5 border border-red-500/15 p-4 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-wider mb-1">
              Aviso de Liquidacao
            </p>
            <p className="text-xs text-gray-400">
              Se o preco atingir{" "}
              <span className="text-red-400 font-bold">
                ${Number(data.liquidation).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>{" "}
              a tua posicao sera liquidada automaticamente. O Stop Loss em{" "}
              <span className="text-yellow-400 font-bold">
                ${Number(data.stopLoss).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>{" "}
              protege-te antes de chegar a esse nivel.
            </p>
          </div>
        </div>
      </div>

      {/* SGT */}
      <div className="relative text-xs px-4 py-3 rounded-xl border bg-[#F7931A]/5 border-[#F7931A]/10 text-[#F7931A]/80">
        SGT: {data.riskSuggestion}
      </div>
    </div>
  );
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

export default function SigmaPage() {
  const supabase = useMemo(() => createClient(), []);

  const [pair,        setPair]        = useState("BTCUSDT");
  const [capital,     setCapital]     = useState(100);
  const [leverage,    setLeverage]    = useState(10);
  const [risk,        setRisk]        = useState(2);
  const [traderLevel, setTraderLevel] = useState("beginner");
  const [result,      setResult]      = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("trading_profiles")
        .select("trader_level, capital, risk_percent")
        .eq("user_id", user.id)
        .single();
      if (profile?.trader_level) setTraderLevel(profile.trader_level);
      if (profile?.capital)      setCapital(profile.capital);
      if (profile?.risk_percent) setRisk(profile.risk_percent);
    }
    loadProfile();
  }, [supabase]);

  async function handleAnalyze() {
    if (isAnalyzing) return;
    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/sigma/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pair, capital, leverage, risk, traderLevel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro na analise");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao gerar analise. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <Image src="/hero-b.webp" alt="Background" fill priority className="object-cover opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      <div className="relative max-w-4xl mx-auto space-y-10 py-10 px-4">

        {/* Header */}
<div className="flex items-center gap-4">
  <Image src="/sigma.svg" alt="Sigma Bot" width={60} height={60} />
  <div>
    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight">
      SIGMA{" "}
      <span className="relative inline-block">
        <span className="bg-gradient-to-r from-[#F7931A] via-[#627EEA] to-[#F7931A] bg-clip-text text-transparent animate-gradient-x">
          BOT
        </span>
      </span>
    </h1>
    <p className="text-gray-400">
      Inteligencia de futuros cripto — BTC & ETH — powered by Gemini 2.5 Flash
    </p>
  </div>
</div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {["BTC/USDT", "ETH/USDT"].map((p) => (
            <div key={p} className="flex items-center gap-2 bg-[#F7931A]/10 border border-[#F7931A]/30 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-[#F7931A] rounded-full animate-pulse" />
              <span className="text-[#F7931A] font-black text-sm tracking-wider">{p}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-lg">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400 text-sm font-bold">Mercado 24/7</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6 backdrop-blur">
          <h2 className="text-lg font-bold text-white">Configurar Analise</h2>

          <div className="grid sm:grid-cols-2 gap-4">

            {/* Par */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Par</label>
              <div className="flex gap-2">
                {PAIRS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPair(p)}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${
                      pair === p
                        ? "bg-[#F7931A] text-black border-[#F7931A]"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-[#F7931A]/50"
                    }`}
                  >
                    {p.replace("USDT", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Alavancagem */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Alavancagem maxima
              </label>
              <div className="flex gap-2">
                {LEVERAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLeverage(l)}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${
                      leverage === l
                        ? l >= 20
                          ? "bg-red-500 text-white border-red-500"
                          : l >= 10
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-green-500 text-black border-green-500"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {l}x
                  </button>
                ))}
              </div>
              {leverage >= 20 && (
                <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  20x — Risco extremo. Apenas para traders experientes.
                </p>
              )}
            </div>

            {/* Capital */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Capital ($)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-[#F7931A] transition"
                placeholder="Ex: 100"
                min={1}
              />
            </div>

            {/* Risco */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Risco (%)</label>
              <input
                type="number"
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-[#F7931A] transition"
                placeholder="Ex: 2"
                min={0.1}
                max={10}
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
            disabled={isAnalyzing}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 ${
              isAnalyzing
                ? "bg-gray-700 cursor-not-allowed opacity-60"
                : "bg-[#F7931A] hover:bg-[#e8851a] shadow-[0_0_20px_rgba(247,147,26,0.3)]"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                A analisar {pair}...
              </span>
            ) : (
              `▶ Iniciar Análise ${pair}`
            )}
          </button>
        </div>

        {/* Resultado */}
        {result && <SigmaResultCard data={result} capital={capital} />}
      </div>
    </div>
  );
}
