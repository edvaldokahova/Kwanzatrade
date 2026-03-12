"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24History } from "@/lib/saveBot24History";

type Bot24HistoryItem = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
  trading_window: string;
  risk_suggestion: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward: any;
  trend: string;
  market_score: number;
  probability: number;
  created_at: string;
};

export default function Bot24HistoryPage() {
  const [history, setHistory] = useState<Bot24HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Bot24HistoryItem>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("bot24_history")
          .select("*")
          .order(sortField, { ascending: sortAsc });

        setHistory(data || []);

        const { data: countData } = await supabase.rpc("get_daily_analysis_count", { user_uuid: user.id });
        setDailyCount(countData || 0);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sortField, sortAsc]);

  function toggleSort(field: keyof Bot24HistoryItem) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  async function handleRedo(item: Bot24HistoryItem) {
    if (dailyCount >= 10) {
      alert("Limite diário atingido.");
      return;
    }

    setLoading(true);
    try {
      const analysis = await runBot24Analysis({
        pair: item.pair,
        capital: 1000, // Capital padrão ou recuperado do perfil
        timeframe: item.timeframe,
        traderLevel: "intermediate",
        risk: 2
      });

      await saveBot24History(analysis);
      
      // Recarregar histórico
      const { data } = await supabase.from("bot24_history").select("*").order("created_at", { ascending: false });
      setHistory(data || []);
      setDailyCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-6 px-4">
      <h1 className="text-3xl font-bold">Bot24 History</h1>
      <p className="text-gray-400">Análises de hoje: {dailyCount} / 10</p>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden text-sm">
          <thead className="bg-gray-800 text-left">
            <tr>
              {["pair", "signal", "confidence", "trend", "market_score", "probability", "timeframe", "created_at"].map((field) => (
                <th 
                  key={field} 
                  onClick={() => toggleSort(field as keyof Bot24HistoryItem)}
                  className="px-4 py-3 cursor-pointer hover:text-green-400 uppercase text-[10px] font-bold tracking-wider"
                >
                  {field.replace("_", " ")}
                </th>
              ))}
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 animate-pulse">Loading...</td></tr>
            ) : history.map(item => (
              <tr key={item.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3 font-bold">{item.pair}</td>
                <td className={`px-4 py-3 font-bold ${item.signal === "BUY" ? "text-green-400" : "text-red-500"}`}>{item.signal}</td>
                <td className="px-4 py-3">{item.confidence}%</td>
                <td className="px-4 py-3">{item.trend}</td>
                <td className="px-4 py-3 text-green-400">{item.market_score}</td>
                <td className="px-4 py-3">{item.probability}%</td>
                <td className="px-4 py-3">{item.timeframe}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleRedo(item)} className="bg-blue-600 px-3 py-1 rounded text-xs font-bold">Redo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
      
