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
  risk_reward: number;

  // Novos campos adicionados
  trend: string;
  market_score: string;
  probability: number;

  created_at: string;
};

type TradingProfile = {
  capital: number;
  risk_percent: number;
  trader_level: string;
};

export default function Bot24HistoryPage() {

  const [history, setHistory] = useState<Bot24HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Bot24HistoryItem>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [profile, setProfile] = useState<TradingProfile | null>(null);

  useEffect(() => {

    async function fetchData() {

      setLoading(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("bot24_history")
        .select("*")
        .order(sortField, { ascending: sortAsc });

      setHistory(data || []);

      const { data: countData } = await supabase.rpc(
        "get_daily_analysis_count",
        { user_uuid: user.id }
      );

      setDailyCount(countData || 0);

      const { data: profileData } = await supabase
        .from("trading_profiles")
        .select("capital, risk_percent, trader_level")
        .eq("user_id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      setLoading(false);

    }

    fetchData();

  }, [sortField, sortAsc]);

  function toggleSort(field: keyof Bot24HistoryItem) {

    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }

  }

  async function handleRedo(item: Bot24HistoryItem) {

    if (dailyCount >= 10) {
      alert("Você atingiu o limite diário de 10 análises.");
      return;
    }

    if (!profile) return;

    setLoading(true);

    const analysis = await runBot24Analysis({
      pair: item.pair,
      capital: profile.capital,
      timeframe: item.timeframe,
      traderLevel: profile.trader_level,
      risk: profile.risk_percent
    });

    await saveBot24History(analysis);

    setDailyCount(prev => prev + 1);

    const { data } = await supabase
      .from("bot24_history")
      .select("*")
      .order("created_at", { ascending: false });

    setHistory(data || []);

    setLoading(false);

  }

  return (

    <div className="max-w-7xl mx-auto py-10 space-y-6 px-4">

      <h1 className="text-3xl font-bold">
        Bot24 History
      </h1>

      <p className="text-gray-400">
        Análises de hoje: {dailyCount} / 10
      </p>

      <div className="overflow-x-auto">

        <table className="min-w-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">

          <thead className="bg-gray-800 text-left">

            <tr>

              <th onClick={() => toggleSort("pair")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Pair</th>

              <th onClick={() => toggleSort("signal")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Signal</th>

              <th onClick={() => toggleSort("confidence")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Conf.</th>
              
              {/* Novas Colunas no Header */}
              <th onClick={() => toggleSort("trend")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Trend</th>
              
              <th onClick={() => toggleSort("market_score")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Score</th>
              
              <th onClick={() => toggleSort("probability")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Prob.</th>

              <th className="px-6 py-3">Entry</th>

              <th className="px-6 py-3">SL</th>

              <th className="px-6 py-3">TP</th>

              <th className="px-6 py-3">RR</th>

              <th onClick={() => toggleSort("timeframe")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">TF</th>

              <th onClick={() => toggleSort("created_at")} className="px-6 py-3 cursor-pointer hover:text-green-400 transition">Date</th>

              <th className="px-6 py-3 text-center">Action</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-700">

            {loading ? (

              <tr>
                <td colSpan={13} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">Loading History...</span>
                  </div>
                </td>
              </tr>

            ) : history.length === 0 ? (
              
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-500">
                  Nenhuma análise encontrada.
                </td>
              </tr>

            ) : history.map(item => (

              <tr key={item.id} className="hover:bg-gray-800/50 transition">

                <td className="px-6 py-3 font-medium">{item.pair}</td>

                <td className={`px-6 py-3 font-bold ${
                  item.signal === "BUY"
                    ? "text-green-400"
                    : item.signal === "SELL"
                    ? "text-red-500"
                    : "text-yellow-400"
                }`}>
                  {item.signal}
                </td>

                <td className="px-6 py-3 whitespace-nowrap">
                  {item.confidence}%
                </td>

                {/* Novos Dados na Tabela */}
                <td className={`px-6 py-3 font-semibold ${
                  item.trend?.includes("Bullish") ? "text-green-400" : 
                  item.trend?.includes("Bearish") ? "text-red-400" : "text-gray-300"
                }`}>
                  {item.trend}
                </td>

                <td className="px-6 py-3 text-green-400 font-mono">
                  {item.market_score}
                </td>

                <td className="px-6 py-3">
                  {item.probability}%
                </td>

                <td className="px-6 py-3 font-mono">
                  {item.entry_price}
                </td>

                <td className="px-6 py-3 text-red-400 font-mono">
                  {item.stop_loss}
                </td>

                <td className="px-6 py-3 text-green-400 font-mono">
                  {item.take_profit}
                </td>

                <td className="px-6 py-3">
                  {item.risk_reward}
                </td>

                <td className="px-6 py-3">
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                    {item.timeframe}
                  </span>
                </td>

                <td className="px-6 py-3 text-sm text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>

                <td className="px-6 py-3 text-center">

                  <button
                    onClick={() => handleRedo(item)}
                    disabled={dailyCount >= 10}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition px-4 py-1.5 rounded text-sm font-semibold"
                  >
                    Redo
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}