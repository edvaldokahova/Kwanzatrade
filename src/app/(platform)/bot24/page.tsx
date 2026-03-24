"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import NextLink from "next/link";
import { ArrowUpRight, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

type Bot24HistoryItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
  created_at: string;
};

type HeatmapItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
};

function signalBadgeClass(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("BUY"))
    return "bg-green-500/15 text-green-400 border border-green-500/20";
  if (s.includes("SELL"))
    return "bg-red-500/15 text-red-400 border border-red-500/20";
  return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
}

function heatmapCardClass(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("BUY"))
    return "bg-green-600/20 border border-green-500/20 text-green-300";
  if (s.includes("SELL"))
    return "bg-red-600/20 border border-red-500/20 text-red-300";
  return "bg-yellow-500/10 border border-yellow-500/20 text-yellow-300";
}

export default function Bot24Dashboard() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [history, setHistory] = useState<Bot24HistoryItem[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const { data: histData } = await supabase
          .from("bot24_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        const { data: heatData } = await supabase
          .from("forex_heatmap")
          .select("*")
          .order("confidence", { ascending: false })
          .limit(8);

        setHistory(histData || []);
        setHeatmap(heatData || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [supabase]);

  return (
    <div className="relative min-h-screen">
      {/* Background — ✅ overlay separado do conteúdo */}
      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto py-10 px-4 space-y-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image src="/bot24_an.svg" alt="Bot24" width={60} height={60} />
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-left">
            BOT24 <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              INTELLIGENCE
            </span>
           </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Sistema de análise algorítmica de Forex.
              </p>
            </div>
          </div>

          <NextLink
            href="/bot24/analyze"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)]"
          >
            Nova Análise
            <ArrowUpRight size={18} />
          </NextLink>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Análises hoje", value: history.length },
            { label: "Pares no heatmap", value: heatmap.length },
            {
              label: "Sinal dominante",
              value:
                heatmap.length > 0
                  ? heatmap[0].signal
                  : "—",
            },
            {
              label: "Confiança máx.",
              value:
                heatmap.length > 0
                  ? `${heatmap[0].confidence}%`
                  : "—",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4"
            >
              <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-white mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* History */}
          <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-3xl backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Histórico Recente</h2>
              <NextLink
                href="/bot24/history"
                className="text-xs text-green-500 font-bold flex items-center gap-1 hover:text-green-400 transition"
              >
                Ver tudo
                <ArrowUpRight size={12} />
              </NextLink>
            </div>

            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-800/50 animate-pulse rounded-xl" />
                ))}
              </div>
            )}

            {!loading && history.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">Nenhuma análise registrada ainda.</p>
                <NextLink
                  href="/bot24/analyze"
                  className="inline-block mt-3 text-xs text-green-500 font-bold hover:underline"
                >
                  Fazer primeira análise →
                </NextLink>
              </div>
            )}

            {!loading && (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl hover:border-green-500/30 hover:bg-gray-800/60 transition"
                  >
                    <div>
                      <p className="text-white font-bold">{item.pair}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.timeframe}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg ${signalBadgeClass(item.signal)}`}
                    >
                      {item.signal.toUpperCase().includes("BUY") ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {item.signal}
                    </span>

                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{item.confidence}%</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-3xl backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Live Market Heatmap</h2>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-green-500" />
                <NextLink
                  href="/bot24/heatmap"
                  className="text-xs text-green-500 font-bold flex items-center gap-1 hover:text-green-400 transition"
                >
                  Ver completo
                  <ArrowUpRight size={12} />
                </NextLink>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800/50 animate-pulse rounded-xl" />
                ))}
              </div>
            )}

            {!loading && heatmap.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-10">
                Dados do mercado indisponíveis.
              </p>
            )}

            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {heatmap.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center text-center font-bold hover:scale-[1.03] transition-all cursor-default ${heatmapCardClass(item.signal)}`}
                  >
                    <span className="text-base font-black">{item.pair}</span>
                    <span className="text-[10px] uppercase opacity-80 tracking-wider mt-0.5">
                      {item.signal}
                    </span>
                    <span className="text-sm font-bold mt-1">{item.confidence}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
