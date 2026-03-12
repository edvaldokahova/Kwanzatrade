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
  created_at: string;
};

type HeatmapItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
};

function confidenceColor(signal: string, confidence: number) {
  const isBuy = signal.toUpperCase().includes("BUY");
  const isSell = signal.toUpperCase().includes("SELL");
  
  if (isBuy) return "bg-green-600 text-white";
  if (isSell) return "bg-red-600 text-white";
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
        const { data: histData } = await supabase.from("bot24_history").select("*").order("created_at", { ascending: false }).limit(5);
        const { data: heatData } = await supabase.from("forex_heatmap").select("*").order("confidence", { ascending: false }).limit(6);
        
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
    <div className="max-w-7xl mx-auto py-10 space-y-8 px-4">
      <div className="flex items-center gap-4">
        <Image src="/bot24.svg" alt="Bot24 Logo" width={50} height={50} />
        <h1 className="text-4xl font-bold">Bot24 Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Recent History</h2>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex justify-between p-3 bg-gray-900 rounded border border-gray-700">
                <span className="font-bold">{item.pair}</span>
                <span className={item.signal === "BUY" ? "text-green-400" : "text-red-400"}>{item.signal}</span>
                <span className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Live Heatmap</h2>
          <div className="grid grid-cols-2 gap-4">
            {heatmap.map(item => (
              <div key={item.id} className={`p-4 rounded-lg flex flex-col items-center ${confidenceColor(item.signal, item.confidence)}`}>
                <span className="text-lg font-black">{item.pair}</span>
                <span className="text-xs uppercase">{item.signal}</span>
                <span className="text-sm font-bold">{item.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
