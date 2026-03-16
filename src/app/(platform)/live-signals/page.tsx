"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client"; // ✅ novo client
import { Target, Zap, Activity, BarChart3, Clock, Volume2, VolumeX } from "lucide-react";

type Signal = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
  created_at: string;
  isTop10?: boolean;
  isHighProb?: boolean;
  isTopVol?: boolean;
  isTopMomentum?: boolean;
};

export default function LiveSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [isMuted, setIsMuted] = useState(false);

  const lastSignalIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timeframes = ["All", "M1", "M5", "M15", "M30", "H1", "H4", "D1"];

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audioRef.current.volume = 0.4;
    }
  }, []);

  async function fetchSignals() {
    if (signals.length === 0) setLoading(true);

    try {
      let query = supabase
        .from("live_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (timeframeFilter !== "All") query = query.eq("timeframe", timeframeFilter);

      const { data: signalsData, error: signalsError } = await query;
      if (signalsError) throw signalsError;

      const { data: quantData } = await supabase
        .from("bot24_quant")
        .select("pair, top10, high_probability, top_volatility, top_momentum");

      const mappedSignals = (signalsData || []).map((s) => {
        const q = quantData?.find((item: any) => item.pair === s.pair);
        return {
          ...s,
          isTop10: q?.top10 || false,
          isHighProb: q?.high_probability || false,
          isTopVol: q?.top_volatility || false,
          isTopMomentum: q?.top_momentum || false,
        };
      });

      if (mappedSignals.length > 0) {
        const newestSignal = mappedSignals[0];
        if (
          newestSignal.id !== lastSignalIdRef.current &&
          (newestSignal.isHighProb || newestSignal.confidence >= 90) &&
          !isMuted &&
          !loading
        ) {
          audioRef.current?.play().catch(() => console.log("Áudio aguardando interação do usuário."));
        }
        lastSignalIdRef.current = newestSignal.id;
      }

      setSignals(mappedSignals);
    } catch (error) {
      console.error("Erro ao buscar sinais ao vivo:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  }, [timeframeFilter, isMuted]);

  return (
    <div
      className="max-w-6xl mx-auto py-10 px-4 space-y-10 relative"
      style={{
        backgroundColor: "#0d0d0d",
        backgroundImage: "url('/hero-b.webp')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.1, // 🔹 opacidade baixa
      }}
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="space-y-4">
          <div className="text-xl font-black text-white tracking-tighter">
            KwanzaTrade <span className="text-blue-500 italic">LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">AI Live Signals</h1>
            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">Live Stream</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-all ${
                isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-gray-900 border-gray-800 text-gray-400"
              }`}
              title={isMuted ? "Ativar som" : "Mudar para silencioso"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* FILTRO DE TIMEFRAME */}
        <div className="flex items-center gap-4 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800">
          <div className="flex gap-1 overflow-x-auto">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframeFilter(tf)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                  timeframeFilter === tf
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-gray-500 hover:bg-gray-800"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE SINAIS */}
      <div className="bg-gray-950/50 backdrop-blur-md rounded-[2.5rem] border border-gray-800/50 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-6">Asset Pair</th>
                <th className="p-6 text-center">Signal Type</th>
                <th className="p-6 text-center">Confidence</th>
                <th className="p-6 text-center">TF</th>
                <th className="p-6 text-right">Time (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                      <span className="text-gray-400 text-xs font-black uppercase tracking-widest">
                        Scanning Market Pulse...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : signals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-500 uppercase text-xs font-bold">
                    Nenhum sinal detectado para este filtro no momento.
                  </td>
                </tr>
              ) : (
                signals.map((s) => (
                  <tr key={s.id} className="group hover:bg-blue-600/[0.03] transition-all">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-white group-hover:text-blue-400 transition tracking-tighter italic">
                            {s.pair}
                          </span>
                          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                            Bot24 Verified
                          </span>
                        </div>
                        {s.isHighProb && (
                          <div className="bg-yellow-400/10 p-1.5 rounded-lg border border-yellow-400/20">
                            <Target className="w-4 h-4 text-yellow-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider
                      ${s.isHighProb ? "bg-yellow-500 border-yellow-400 text-black" :
                          s.isTop10 ? "bg-green-600 border-green-500 text-white" :
                            s.signal.toUpperCase().includes("BUY") ? "bg-gray-900 border-green-500/30 text-green-400" :
                              "bg-gray-900 border-red-500/30 text-red-400"
                        }`}
                      >
                        {s.isTop10 && <Zap size={12} className="fill-current" />}
                        {s.isTopVol && <Activity size={12} />}
                        {s.signal}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`text-xs font-black ${s.confidence >= 80 ? "text-yellow-400" : "text-blue-400"}`}
                        >
                          {s.confidence}%
                        </span>
                        <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              s.confidence >= 80 ? "bg-yellow-400" : "bg-blue-500"
                            }`}
                            style={{ width: `${s.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black border border-gray-800">
                        {s.timeframe}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-600">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold font-mono">
                          {new Date(s.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER / LEGENDA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          { icon: Target, label: "Alta Probabilidade (+85%)", color: "text-yellow-400", bg: "bg-yellow-400/5" },
          { icon: Zap, label: "Top 10 Força", color: "text-green-500", bg: "bg-green-500/5" },
          { icon: Activity, label: "Alta Volatilidade", color: "text-red-500", bg: "bg-red-500/5" },
          { icon: BarChart3, label: "Momentum IA", color: "text-blue-500", bg: "bg-blue-500/5" },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border border-gray-800/50 ${item.bg}`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
