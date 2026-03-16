"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24History } from "@/lib/saveBot24History";
import { Clock, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

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

const COLUMNS: { field: keyof Bot24HistoryItem; label: string }[] = [
  { field: "pair", label: "Par" },
  { field: "signal", label: "Sinal" },
  { field: "confidence", label: "Confiança" },
  { field: "trend", label: "Tendência" },
  { field: "market_score", label: "Score" },
  { field: "probability", label: "Prob." },
  { field: "timeframe", label: "TF" },
  { field: "created_at", label: "Data" },
];

export default function Bot24HistoryPage() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [history, setHistory] = useState<Bot24HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Bot24HistoryItem>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [traderLevel, setTraderLevel] = useState("intermediate");
  const [redoingId, setRedoingId] = useState<string | null>(null);

  // ✅ useCallback para fetch estável
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("bot24_history")
        .select("*")
        .order(sortField, { ascending: sortAsc });
      setHistory(data || []);

      const { data: countData } = await supabase.rpc("get_daily_analysis_count", {
        user_uuid: user.id,
      });
      setDailyCount(countData || 0);

      // ✅ Busca o nível real do trader
      const { data: profile } = await supabase
        .from("users")
        .select("trader_level")
        .eq("id", user.id)
        .single();
      if (profile?.trader_level) setTraderLevel(profile.trader_level);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, sortField, sortAsc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleSort(field: keyof Bot24HistoryItem) {
    if (sortField === field) setSortAsc((prev) => !prev);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  async function handleRedo(item: Bot24HistoryItem) {
    if (dailyCount >= 10) {
      alert("Limite diário de análises atingido.");
      return;
    }

    setRedoingId(item.id);
    try {
      // ✅ Usa o nível real do trader, não hardcoded
      const analysis = await runBot24Analysis({
        pair: item.pair,
        capital: 1000,
        timeframe: item.timeframe,
        traderLevel,
        risk: 2,
      });

      await saveBot24History(analysis);

      const { data } = await supabase
        .from("bot24_history")
        .select("*")
        .order("created_at", { ascending: false });
      setHistory(data || []);
      setDailyCount((prev) => prev + 1);
    } catch (err) {
      console.error("Redo error:", err);
      alert("Erro ao refazer análise.");
    } finally {
      setRedoingId(null);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto py-10 px-4 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Bot24 History
            </h1>
            <p className="text-gray-400 mt-1">
              Análises registradas:{" "}
              <span className="text-green-400 font-bold">{dailyCount} / 10 hoje</span>
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl border border-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-800">
          <table className="min-w-full text-sm text-left bg-gray-900/80 backdrop-blur">
            <thead className="bg-gray-800/90 text-gray-400 text-[10px] uppercase tracking-wider">
              <tr>
                {COLUMNS.map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="px-4 py-4 cursor-pointer hover:text-green-400 font-bold select-none transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {sortField === field && (
                        <span className="text-green-400">
                          {sortAsc ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                      <span className="text-gray-500 text-xs uppercase tracking-widest">
                        Carregando histórico...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 1}
                    className="text-center py-16 text-gray-500 text-sm"
                  >
                    Nenhuma análise encontrada. Execute sua primeira análise no Bot24.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-800/40 transition-all duration-150"
                  >
                    <td className="px-4 py-3 font-bold text-white">{item.pair}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          item.signal?.toUpperCase().includes("BUY")
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {item.signal?.toUpperCase().includes("BUY") ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {item.signal}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-300 font-medium">
                      {item.confidence}%
                    </td>
                    <td className="px-4 py-3 text-gray-400">{item.trend ?? "—"}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">
                      {item.market_score ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {item.probability != null ? `${item.probability}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono">
                        {item.timeframe}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRedo(item)}
                        disabled={redoingId === item.id || dailyCount >= 10}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${redoingId === item.id ? "animate-spin" : ""}`}
                        />
                        {redoingId === item.id ? "..." : "Redo"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
