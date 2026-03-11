"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Flame } from "lucide-react";

type Bot24HistoryItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
  trading_window: string;
  risk_suggestion: string;
  created_at: string;
};

type HeatmapItem = {
  id: string;
  pair: string;
  signal: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  confidence: number;
  timeframe: string;
};

// Função para gradiente de cores Heatmap
function confidenceColor(signal: string, confidence: number) {
  if (signal.includes("Buy")) {
    const intensity = Math.min(Math.max(confidence, 0), 100);
    return `bg-green-${Math.floor(400 + (intensity / 100) * 200)} text-white`;
  } else if (signal.includes("Sell")) {
    const intensity = Math.min(Math.max(confidence, 0), 100);
    return `bg-red-${Math.floor(400 + (intensity / 100) * 200)} text-white`;
  } else {
    return "bg-yellow-400 text-black";
  }
}

export default function Bot24Dashboard() {
  // History States
  const [history, setHistory] = useState<Bot24HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Bot24HistoryItem>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Heatmap States
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [topN, setTopN] = useState(10);

  // Fetch History
  useEffect(() => {
    async function fetchHistory() {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("bot24_history")
        .select("*")
        .order(sortField, { ascending: sortAsc });
      if (error) console.error(error);
      else setHistory(data || []);
      setHistoryLoading(false);
    }
    fetchHistory();
  }, [sortField, sortAsc]);

  function toggleSort(field: keyof Bot24HistoryItem) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // Fetch Heatmap
  useEffect(() => {
    async function fetchHeatmap() {
      setHeatmapLoading(true);
      let query = supabase.from("forex_heatmap").select("*").order("confidence", { ascending: false });
      if (timeframeFilter !== "All") query = query.eq("timeframe", timeframeFilter);
      const { data, error } = await query;
      if (error) console.error(error);
      else setHeatmap((data || []).slice(0, topN));
      setHeatmapLoading(false);
    }
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 30000);
    return () => clearInterval(interval);
  }, [timeframeFilter, topN]);

  const timeframes = ["All", "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-8">

      {/* LOGO */}
      <div className="flex items-center gap-4">
        <Image src="/bot24.png" alt="Bot24 Logo" width={60} height={60} className="rounded-lg"/>
        <h1 className="text-4xl font-bold">Bot24 Dashboard</h1>
      </div>

      <p className="text-gray-400">
        Histórico de análises + Heatmap Forex em tempo real
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: History */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Bot24 History</h2>
          <table className="min-w-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <thead className="bg-gray-800">
              <tr>
                <th onClick={() => toggleSort("pair")} className="px-4 py-2 cursor-pointer hover:text-green-400">Pair</th>
                <th onClick={() => toggleSort("signal")} className="px-4 py-2 cursor-pointer hover:text-green-400">Signal</th>
                <th onClick={() => toggleSort("confidence")} className="px-4 py-2 cursor-pointer hover:text-green-400">Confidence</th>
                <th onClick={() => toggleSort("timeframe")} className="px-4 py-2 cursor-pointer hover:text-green-400">Timeframe</th>
                <th onClick={() => toggleSort("created_at")} className="px-4 py-2 cursor-pointer hover:text-green-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No history yet</td></tr>
              ) : history.map(item => (
                <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-800 transition">
                  <td className="px-4 py-2">{item.pair}</td>
                  <td className={`px-4 py-2 font-bold ${item.signal.toUpperCase() === "BUY" ? "text-green-400" : item.signal.toUpperCase() === "SELL" ? "text-red-500" : "text-yellow-400"}`}>{item.signal}</td>
                  <td className="px-4 py-2">{item.confidence}%</td>
                  <td className="px-4 py-2">{item.timeframe}</td>
                  <td className="px-4 py-2">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Heatmap */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            Forex Heatmap
          </h2>

          {/* Filters */}
          <div className="flex gap-4 mb-4 items-center">
            <select value={timeframeFilter} onChange={(e) => setTimeframeFilter(e.target.value)} className="bg-gray-800 p-2 rounded">
              {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
            <input type="number" min={1} max={50} value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="bg-gray-800 p-2 rounded w-20"/>
            <span className="text-gray-400">Top N pares</span>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            {heatmapLoading ? (
              <div className="col-span-full text-center py-10 text-gray-400">Loading...</div>
            ) : (
              heatmap.map(item => (
                <div key={item.id} className={`rounded-xl p-4 flex flex-col justify-center items-center font-bold shadow-md cursor-pointer transition transform hover:scale-105 ${confidenceColor(item.signal, item.confidence)}`} 
                     title={`Pair: ${item.pair}\nSignal: ${item.signal}\nConfidence: ${item.confidence}%\nTimeframe: ${item.timeframe}`}>
                  <span className="text-lg flex items-center gap-1">
                    {item.pair}
                    {item.confidence >= 80 && <Fire className="w-4 h-4 text-yellow-400 animate-pulse" />}
                  </span>
                  <span className="text-xl">{item.signal}</span>
                  <span className="text-sm opacity-80">{item.confidence}%</span>
                  <span className="text-xs opacity-50">{item.timeframe}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
