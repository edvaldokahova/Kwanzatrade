"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
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

export default function ForexHeatmapPremium() {

  const [data, setData] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [topN, setTopN] = useState(10);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [traderLevel, setTraderLevel] = useState<string>("beginner");
  const [showLegend, setShowLegend] = useState(true);

  const DAILY_LIMIT = 10;

  /* MARKET SESSION TRACKER */

  function getMarketSessions() {

    const hour = new Date().getUTCHours();

    const tokyo = hour >= 0 && hour < 9;
    const london = hour >= 7 && hour < 16;
    const newYork = hour >= 12 && hour < 21;

    return {
      tokyo,
      london,
      newYork
    };
  }

  const sessions = getMarketSessions();

  useEffect(() => {

    async function fetchData() {

      setLoading(true);

      try {

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: countData } = await supabase.rpc(
          "get_daily_analysis_count",
          { user_uuid: user.id }
        );

        setAnalysisCount(countData || 0);

        const { data: profile } = await supabase
          .from("users")
          .select("trader_level")
          .eq("id", user.id)
          .single();

        if (profile?.trader_level) {
          setTraderLevel(profile.trader_level);
        }

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

        const mappedData = (heatmapData || []).map((h) => {

          const q = quantData?.find((q: any) => q.pair === h.pair);

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
    }

    fetchData();

    const interval = setInterval(fetchData, 300000);

    return () => clearInterval(interval);

  }, [timeframeFilter, topN]);

  const getXMButtonLink = () =>
    traderLevel === "beginner"
      ? XM_LINKS.beginner
      : XM_LINKS.advanced;

  const getQuantColor = (item: HeatmapItem) => {

    if (item.isHighProb)
      return "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]";

    if (item.isTop10)
      return "bg-green-400 text-black";

    if (item.isTopVol)
      return "bg-red-500 text-white";

    if (item.isTopMomentum)
      return "bg-blue-400 text-white";

    return "bg-gray-800 text-gray-300 border border-gray-700";
  };

  return (

    <div className="relative min-h-screen">

      {/* HERO BACKGROUND */}

      <Image
        src="/hero-b.webp"
        alt="Forex Background"
        fill
        priority
        className="object-cover opacity-10"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      <div className="relative max-w-6xl mx-auto py-10 space-y-8 px-4 pb-32">

        {/* HEADER */}

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

          <div className="bg-gray-900/60 backdrop-blur-xl p-3 rounded-lg border border-gray-800 text-sm">

            Análises restantes hoje:
            {" "}
            <span className="text-green-400 font-bold">
              {Math.max(0, DAILY_LIMIT - analysisCount)}
            </span>

          </div>

        </div>

        {/* MARKET SESSIONS */}

        <div className="grid grid-cols-3 gap-4">

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase">London</p>
            <p className={`font-bold ${sessions.london ? "text-green-400" : "text-red-400"}`}>
              ● {sessions.london ? "OPEN" : "CLOSED"}
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase">New York</p>
            <p className={`font-bold ${sessions.newYork ? "text-green-400" : "text-red-400"}`}>
              ● {sessions.newYork ? "OPEN" : "CLOSED"}
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase">Tokyo</p>
            <p className={`font-bold ${sessions.tokyo ? "text-green-400" : "text-red-400"}`}>
              ● {sessions.tokyo ? "OPEN" : "CLOSED"}
            </p>
          </div>

        </div>

        {/* FILTERS */}

        <div className="flex flex-wrap gap-4 items-center bg-gray-900/40 p-4 rounded-xl border border-gray-800 backdrop-blur">

          <div className="flex flex-col gap-1">

            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Timeframe
            </span>

            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
            >

              {["All","M1","M5","M15","M30","H1","H4","D1","W1"].map((tf) => (

                <option key={tf}>
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
              onChange={(e)=>setTopN(Number(e.target.value))}
              className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 w-24"
            />

          </div>

        </div>

        {/* GRID */}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

          {loading ? (

            <div className="col-span-full text-center py-20">

              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"/>

              <p className="text-gray-500">
                Calculando algoritmos quantitativos...
              </p>

            </div>

          ) : (

            data.map((item) => (

              <div
                key={item.id}
                className={`relative rounded-xl p-5 flex flex-col items-center justify-between min-h-[170px] transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl group ${getQuantColor(item)}`}
              >

                <div className="absolute top-2 right-2 flex gap-1">

                  {item.isHighProb && (
                    <Target className="w-4 h-4 text-black animate-pulse"/>
                  )}

                  {item.isTop10 && (
                    <Zap className="w-4 h-4 text-black fill-current"/>
                  )}

                </div>

                <div className="text-center">

                  <span className="text-[10px] uppercase opacity-60 font-black tracking-widest">
                    {item.timeframe}
                  </span>

                  <h3 className="text-xl font-black tracking-tighter">
                    {item.pair}
                  </h3>

                </div>

                <div className="text-center my-2">

                  <span className="text-3xl font-black">
                    {item.confidence}%
                  </span>

                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
                    {item.signal}
                  </p>

                </div>

                <a
                  href={analysisCount >= DAILY_LIMIT ? undefined : getXMButtonLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter text-center transition-all ${
                    analysisCount >= DAILY_LIMIT
                      ? "opacity-50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >

                  {analysisCount >= DAILY_LIMIT
                    ? "Limite Atingido"
                    : "Analisar na XM"}

                </a>

              </div>

            ))

          )}

        </div>

        {/* LEGEND */}

        {showLegend && (

          <div className="fixed bottom-6 right-6 z-50">

            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 p-5 rounded-2xl shadow-2xl max-w-xs space-y-4">

              <div className="flex items-center justify-between">

                <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">

                  <Info className="w-4 h-4 text-blue-400"/>
                  Quant Legend

                </h4>

                <button
                  onClick={()=>setShowLegend(false)}
                  className="text-gray-500 hover:text-white text-xs"
                >
                  Ocultar
                </button>

              </div>

              <div className="grid gap-3 text-[10px] text-gray-300">

                <div className="flex items-center gap-3">

                  <div className="w-4 h-4 bg-yellow-400 rounded-sm"/>

                  <span>
                    <span className="text-yellow-400 font-bold">
                      Alta Probabilidade:
                    </span>
                    {" "}Precisão +85%.
                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <div className="w-4 h-4 bg-green-400 rounded-sm"/>

                  <span>
                    <span className="text-green-400 font-bold">
                      Top 10 Força:
                    </span>
                    {" "}Volume e tendência.
                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <div className="w-4 h-4 bg-red-500 rounded-sm"/>

                  <span>
                    <span className="text-red-400 font-bold">
                      Alta Volatilidade:
                    </span>
                    {" "}Ideal para scalping.
                  </span>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}
