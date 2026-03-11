"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { 
  Target, Zap, Activity, BarChart3, 
  Clock, Filter, AlertCircle, Volume2, VolumeX 
} from "lucide-react";

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
  
  // Refs para controlar o áudio e evitar repetições
  const lastSignalIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timeframes = ["All", "M1", "M5", "M15", "M30", "H1", "H4", "D1"];

  // Inicializa o áudio apenas no cliente
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    audioRef.current.volume = 0.4;
  }, []);

  async function fetchSignals() {
    if (signals.length === 0) setLoading(true);

    try {
      let query = supabase
        .from("live_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (timeframeFilter !== "All") {
        query = query.eq("timeframe", timeframeFilter);
      }

      const { data: signalsData } = await query;
      const { data: quantData } = await supabase
        .from("bot24_quant")
        .select("pair, top10, high_probability, top_volatility, top_momentum");

      const mappedSignals = (signalsData || []).map((s) => {
        const q = quantData?.find((q) => q.pair === s.pair);
        return {
          ...s,
          isTop10: q?.top10 || false,
          isHighProb: q?.high_probability || false,
          isTopVol: q?.top_volatility || false,
          isTopMomentum: q?.top_momentum || false,
        };
      });

      // LÓGICA DE NOTIFICAÇÃO SONORA
      if (mappedSignals.length > 0) {
        const newestSignal = mappedSignals[0];
        
        // Se o sinal for novo E for de Alta Probabilidade E não estiver mutado
        if (
          newestSignal.id !== lastSignalIdRef.current && 
          newestSignal.isHighProb && 
          !isMuted && 
          !loading // Evita tocar ao carregar a página pela primeira vez
        ) {
          audioRef.current?.play().catch(e => console.log("Áudio bloqueado pelo browser até interação do user."));
        }
        
        lastSignalIdRef.current = newestSignal.id;
      }

      setSignals(mappedSignals);
    } catch (error) {
      console.error("Erro ao buscar sinais:", error);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000); 
    return () => clearInterval(interval);
  }, [timeframeFilter, isMuted]);

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-10 px-4">
      
      {/* HEADER COM LOGO E CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-4">
          <Image 
            src="/kwanzatrade-logo.svg" 
            alt="KwanzaTrade" 
            width={160} 
            height={40} 
            className="opacity-90"
          />
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Live Signals
            </h1>
            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">Real-Time</span>
            </div>
            
            {/* BOTÃO DE MUTE */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* FILTRO CUSTOMIZADO */}
        <div className="flex items-center gap-4 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800 font-sans">
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframeFilter(tf)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                  timeframeFilter === tf 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABELA ESTILIZADA */}
      <div className="bg-gray-950/50 backdrop-blur-md rounded-[2.5rem] border border-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-6">Asset Pair</th>
                <th className="p-6 text-center">IA Intelligence</th>
                <th className="p-6 text-center">Confidence</th>
                <th className="p-6 text-center">TF</th>
                <th className="p-6 text-right">Last Sync</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-900/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                      <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Scanning Markets...</span>
                    </div>
                  </td>
                </tr>
              ) : signals.map((s) => (
                <tr key={s.id} className="group hover:bg-blue-600/[0.03] transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-white group-hover:text-blue-400 transition tracking-tighter italic italic">
                          {s.pair}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Forex Market</span>
                      </div>
                      {s.isHighProb && (
                        <div className="bg-yellow-400/10 p-1.5 rounded-lg border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                          <Target className="w-4 h-4 text-yellow-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider
                      ${s.isHighProb ? "bg-yellow-500 border-yellow-400 text-black" :
                        s.isTop10 ? "bg-green-600 border-green-500 text-white" :
                        s.isTopVol ? "bg-red-600 border-red-500 text-white" :
                        s.isTopMomentum ? "bg-blue-600 border-blue-500 text-white" :
                        s.signal.includes("Buy") ? "bg-gray-900 border-green-500/30 text-green-400" :
                        "bg-gray-900 border-red-500/30 text-red-400"
                      }`}
                    >
                      {s.isTop10 && <Zap size={12} className="fill-current" />}
                      {s.isTopVol && <Activity size={12} />}
                      {s.isTopMomentum && <BarChart3 size={12} />}
                      {s.signal}
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`text-xs font-black ${s.confidence >= 80 ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {s.confidence}%
                      </span>
                      <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${s.confidence >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`} 
                          style={{ width: `${s.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="p-6 text-center font-sans">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEGENDA PREMIUM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, label: "Alta Probabilidade", color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/10" },
          { icon: Zap, label: "Top 10 Força", color: "text-green-500", bg: "bg-green-500/5", border: "border-green-500/10" },
          { icon: Activity, label: "Alta Volatilidade", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/10" },
          { icon: BarChart3, label: "Momentum IA", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" }
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${item.bg} ${item.border}`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}