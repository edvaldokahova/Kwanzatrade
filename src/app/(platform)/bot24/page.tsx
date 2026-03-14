"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import NextLink from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

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

function confidenceColor(signal: string) {

  const s = signal.toUpperCase();

  if (s.includes("BUY"))
    return "bg-green-600/90 text-white border border-green-400/30";

  if (s.includes("SELL"))
    return "bg-red-600/90 text-white border border-red-400/30";

  return "bg-yellow-500 text-black";

}

export default function Bot24Dashboard() {

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

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadDashboard();

  }, []);

  return (

    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">

      {/* HEADER */}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div className="flex items-center gap-4">

          <Image
            src="/bot24_an.svg"
            alt="Bot24"
            width={60}
            height={60}
          />

          <div>

            <h1 className="text-4xl font-black text-white tracking-tight">

              Bot24 Intelligence

            </h1>

            <p className="text-gray-500 text-sm">

              Sistema de análise algorítmica de Forex e Crypto.

            </p>

          </div>

        </div>

        <NextLink
          href="/bot24/analyze"
          className="flex items-center gap-2 bg-green-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition shadow-[0_0_25px_rgba(34,197,94,0.35)]"
        >

          Nova Análise

          <ArrowUpRight size={18} />

        </NextLink>

      </header>

      {/* GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* HISTORY */}

        <div className="bg-[#111] border border-white/10 p-8 rounded-3xl">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-black text-white">

              Histórico Recente

            </h2>

            <NextLink
              href="/bot24/history"
              className="text-xs text-green-500 font-bold flex items-center gap-1"
            >
              Ver tudo
              <ArrowUpRight size={12}/>
            </NextLink>

          </div>

          {loading && (

            <div className="space-y-3">

              {[...Array(4)].map((_, i) => (

                <div
                  key={i}
                  className="h-12 bg-gray-800 animate-pulse rounded-lg"
                />

              ))}

            </div>

          )}

          {!loading && history.length === 0 && (

            <p className="text-gray-500 text-sm">

              Nenhuma análise registrada ainda.

            </p>

          )}

          <div className="space-y-3">

            {history.map(item => (

              <div
                key={item.id}
                className="flex items-center justify-between bg-[#0c0c0c] border border-white/10 p-4 rounded-xl hover:border-green-500/30 transition"
              >

                <div>

                  <p className="text-white font-bold">

                    {item.pair}

                  </p>

                  <p className="text-xs text-gray-500">

                    {item.timeframe}

                  </p>

                </div>

                <div className={`px-3 py-1 text-xs font-bold rounded-lg ${confidenceColor(item.signal)}`}>

                  {item.signal}

                </div>

                <div className="text-right">

                  <p className="text-white font-bold text-sm">

                    {item.confidence}%

                  </p>

                  <p className="text-xs text-gray-500">

                    {new Date(item.created_at).toLocaleTimeString()}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* HEATMAP */}

        <div className="bg-[#111] border border-white/10 p-8 rounded-3xl">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-black text-white">

              Live Market Heatmap

            </h2>

            <Sparkles size={18} className="text-green-500"/>

          </div>

          {loading && (

            <div className="grid grid-cols-2 gap-4">

              {[...Array(6)].map((_, i) => (

                <div
                  key={i}
                  className="h-20 bg-gray-800 animate-pulse rounded-xl"
                />

              ))}

            </div>

          )}

          {!loading && heatmap.length === 0 && (

            <p className="text-gray-500 text-sm">

              Dados do mercado indisponíveis.

            </p>

          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {heatmap.map(item => (

              <div
                key={item.id}
                className={`p-5 rounded-xl flex flex-col items-center justify-center text-center font-bold hover:scale-[1.03] transition ${confidenceColor(item.signal)}`}
              >

                <span className="text-lg font-black">

                  {item.pair}

                </span>

                <span className="text-xs uppercase opacity-80">

                  {item.signal}

                </span>

                <span className="text-sm">

                  {item.confidence}%

                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}
