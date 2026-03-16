"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Activity, Target, Zap, Info } from "lucide-react";

type HeatmapItem = {
  id: string;
  pair: string;
  signal: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  confidence: number;
  timeframe: string;
  isTop10?: boolean;
  isHighProb?: boolean;
  isTopVol?: boolean;
  isTopMomentum?: boolean;
};

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

const DAILY_LIMIT = 10;

function getMarketSessions() {
  const hour = new Date().getUTCHours();
  return {
    tokyo: hour >= 0 && hour < 9,
    london: hour >= 7 && hour < 16,
    newYork: hour >= 12 && hour < 21,
  };
}

export default function ForexHeatmapPremium() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [topN, setTopN] = useState(10);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [traderLevel, setTraderLevel] = useState<string>("beginner");
  const [showLegend, setShowLegend] = useState(true);

  const sessions = getMarketSessions();

  // ✅ useCallback para evitar recriação desnecessária
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: countData } = await supabase.rpc("get_daily_analysis_count", {
        user_uuid: user.id,
      });
      setAnalysisCount(countData || 0);

      const { data: profile } = await supabase
        .from("users")
        .select("trader_level")
        .eq("id", user.id)
        .single();
      if (profile?.trader_level) setTraderLevel(profile.trader_level);

      let query = supabase
        .from("forex_heatmap")
        .select("*")
        .order("confidence", { ascending: false });

      if (timeframeFilter !== "All") {
        query = query.eq("timeframe", timeframeFilter);
      }

      const { data: heatmapData } = await query;

      const { data: quantData } = await supabase
        .from("bot24_quant")
        .select("pair, top10, high_probability, top_volatility, top_momentum");

      const mappedData: HeatmapItem[] = (heatmapData || []).map((h) => {
        const q = quantData?.find((item: any) => item.pair === h.pair);
        return {
          ...h,
          isTop10: q?.top10 || false,
          isHighProb: q?.high_probability || false,
          isTopVol: q?.top_volatility || false,
          isTopMomentum: q?.top_momentum || false,
        };
      });

      setData(mappedData.slice(0, topN));
    } catch (err) {
      console.error("Heatmap fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeframeFilter, topN]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getXMButtonLink = () =>
    traderLevel === "beginner" ? XM_LINKS.beginner : XM_LINKS.advanced;

  const getQuantColor = (item: HeatmapItem) => {
    if (item.isHighProb)
      return "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]";
    if (item.isTop10) return "bg-green-400 text-black";
    if (item.isTopVol) return "bg-red-500 text-white";
    if (item.isTopMomentum) return "bg-blue-400 text-white";
    return "bg-gray-800 text-gray-200 border border-gray-700";
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <Image
        src="/hero-b.webp"
        alt="Forex Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto py-10 space-y-8 px-4 pb-32">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              Forex Heatmap Premium
              <Activity className="w-6 h-6 text-green-400" />
            </h1>
            <p className="text-gray-400">
              Análise quantitativa e força de mercado em tempo real
            </p>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-xl px-4 py-2 rounded-lg border border-gray-800 text-sm text-white">
            Análises restantes hoje:{" "}
            <span className="text-green-400 font-bold">
              {Math.max(0, DAILY_LIMIT - analysisCount)}
            </span>
          </div>
        </div>

        {/* Market Sessions */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "London", open: sessions.london },
            { label: "New York", open: sessions.newYork },
            { label: "Tokyo", open: sessions.tokyo },
          ].map(({ label, open }) => (
            <div
              key={label}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`font-bold text-sm ${open ? "text-green-400" : "text-red-400"}`}>
                ● {open ? "OPEN" : "CLOSED"}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 items-end bg-gray-900/40 p-4 rounded-xl border border-gray-800 backdrop-blur">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Timeframe
            </span>
            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500 transition"
            >
              {["All", "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"].map((tf) => (
                <option key={tf} value={tf} className="bg-gray-800">
                  {tf}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Exibir Top
            </span>
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 w-24 focus:outline-none focus:border-green-500 transition"
            />
          </div>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-lg border border-gray-700 transition"
          >
            ↻ Atualizar
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Calculando algoritmos quantitativos...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500 text-sm">
              Nenhum dado disponível para este filtro.
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className={`relative rounded-xl p-5 flex flex-col items-center justify-between min-h-[170px] transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl group ${getQuantColor(item)}`}
              >
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.isHighProb && (
                    <Target className="w-4 h-4 text-black animate-pulse" />
                  )}
                  {item.isTop10 && (
                    <Zap className="w-4 h-4 text-black fill-current" />
                  )}
                </div>

                {/* Pair + TF */}
                <div className="text-center">
                  <span className="text-[10px] uppercase opacity-60 font-black tracking-widest">
                    {item.timeframe}
                  </span>
                  <h3 className="text-xl font-black tracking-tighter">{item.pair}</h3>
                </div>

                {/* Confidence */}
                <div className="text-center my-2">
                  <span className="text-3xl font-black">{item.confidence}%</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
                    {item.signal}
                  </p>
                </div>

                {/* CTA */}
                <a
                  href={analysisCount >= DAILY_LIMIT ? undefined : getXMButtonLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter text-center transition-all ${
                    analysisCount >= DAILY_LIMIT
                      ? "opacity-40 cursor-not-allowed bg-black/20"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {analysisCount >= DAILY_LIMIT ? "Limite Atingido" : "Analisar na XM"}
                </a>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 p-5 rounded-2xl shadow-2xl max-w-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Quant Legend
                </h4>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-gray-500 hover:text-white text-xs transition"
                >
                  ✕ Ocultar
                </button>
              </div>

              <div className="grid gap-3 text-[11px] text-gray-300">
                {[
                  { color: "bg-yellow-400", label: "Alta Probabilidade", desc: "Precisão +85%" },
                  { color: "bg-green-400", label: "Top 10 Força", desc: "Volume e tendência" },
                  { color: "bg-red-500", label: "Alta Volatilidade", desc: "Ideal para scalping" },
                  { color: "bg-blue-400", label: "Top Momentum", desc: "Força direcional" },
                ].map(({ color, label, desc }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${color} rounded-sm flex-shrink-0`} />
                    <span>
                      <b className="text-white">{label}:</b> {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
