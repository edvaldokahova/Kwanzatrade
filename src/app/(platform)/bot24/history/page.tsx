"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24History } from "@/lib/saveBot24History";
import { Clock, RefreshCw, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

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
  { field: "pair",         label: "Par" },
  { field: "signal",       label: "Sinal" },
  { field: "confidence",   label: "Confiança" },
  { field: "trend",        label: "Tendência" },
  { field: "market_score", label: "Score" },
  { field: "probability",  label: "Prob." },
  { field: "timeframe",    label: "TF" },
  { field: "created_at",   label: "Data" },
];

// ─── Card mobile para cada análise ───────────────────────────────────────────

function HistoryCard({
  item,
  onRedo,
  isRedoing,
  limitReached,
}: {
  item: Bot24HistoryItem;
  onRedo: (item: Bot24HistoryItem) => void;
  isRedoing: boolean;
  limitReached: boolean;
}) {
  const isBuy = item.signal?.toUpperCase().includes("BUY");

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-4">

      {/* Linha 1: Par + Sinal + Data */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-lg tracking-tight">{item.pair}</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
            isBuy
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "bg-red-500/15 text-red-400 border border-red-500/20"
          }`}>
            {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {item.signal}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-mono">
          <Clock className="w-3 h-3" />
          {new Date(item.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "2-digit",
            hour: "2-digit", minute: "2-digit",
          })}
        </div>
      </div>

      {/* Linha 2: métricas em grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
            Confiança
          </p>
          <p className="text-white font-black text-sm">{item.confidence}%</p>
        </div>

        <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
            Score
          </p>
          <p className="text-green-400 font-black text-sm">{item.market_score ?? "—"}</p>
        </div>

        <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
            Prob.
          </p>
          <p className="text-white font-black text-sm">
            {item.probability != null ? `${item.probability}%` : "—"}
          </p>
        </div>
      </div>

      {/* Linha 3: Tendência + TF + Redo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400 text-xs">{item.trend ?? "—"}</span>
          </div>
          <span className="text-gray-700">·</span>
          <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-700">
            {item.timeframe}
          </span>
        </div>

        <button
          onClick={() => onRedo(item)}
          disabled={isRedoing || limitReached}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${isRedoing ? "animate-spin" : ""}`} />
          {isRedoing ? "Refazendo..." : "Redo"}
        </button>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Bot24HistoryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [history,     setHistory]     = useState<Bot24HistoryItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sortField,   setSortField]   = useState<keyof Bot24HistoryItem>("created_at");
  const [sortAsc,     setSortAsc]     = useState(false);
  const [dailyCount,  setDailyCount]  = useState(0);
  const [traderLevel, setTraderLevel] = useState("intermediate");
  const [redoingId,   setRedoingId]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      const { data: profile } = await supabase
        .from("trading_profiles")
        .select("trader_level")
        .eq("user_id", user.id)
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
    else { setSortField(field); setSortAsc(true); }
  }

  async function handleRedo(item: Bot24HistoryItem) {
    if (dailyCount >= 10) {
      alert("Limite diário de análises atingido.");
      return;
    }
    setRedoingId(item.id);
    try {
      const analysis = await runBot24Analysis({
        pair:        item.pair,
        capital:     1000,
        timeframe:   item.timeframe,
        traderLevel,
        risk:        2,
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

  const limitReached = dailyCount >= 10;

  return (
    <div className="relative min-h-screen w-full">
      {/* Background */}
      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black" />

      <div className="relative w-full max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-left">
            HISTÓRICO DE <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              ANÁLISES
            </span>
           </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Análises registadas:{" "}
              <span className="text-green-400 font-bold">{dailyCount} / 10 hoje</span>
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl border border-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* ── MOBILE: cards ─────────────────────────────────────────────── */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
              <span className="text-gray-500 text-xs uppercase tracking-widest">
                Sincronizando dados...
              </span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              Nenhuma análise encontrada.
            </div>
          ) : (
            history.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onRedo={handleRedo}
                isRedoing={redoingId === item.id}
                limitReached={limitReached}
              />
            ))
          )}
        </div>

        {/* ── DESKTOP: tabela ───────────────────────────────────────────── */}
        <div className="hidden md:block bg-gray-900/80 backdrop-blur rounded-[2rem] border border-gray-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-800/90 text-gray-400 text-[10px] uppercase tracking-wider">
                <tr>
                  {COLUMNS.map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-6 py-5 cursor-pointer hover:text-green-400 font-bold select-none transition-colors whitespace-nowrap"
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sortField === field && (
                          <span className="text-green-400">{sortAsc ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-5 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                        <span className="text-gray-500 text-xs uppercase tracking-widest">
                          Sincronizando dados...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} className="text-center py-20 text-gray-500 text-sm">
                      Nenhuma análise encontrada.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/40 transition-all duration-150">
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {item.pair}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${
                          item.signal?.toUpperCase().includes("BUY")
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        }`}>
                          {item.signal?.toUpperCase().includes("BUY")
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />}
                          {item.signal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-medium whitespace-nowrap">
                        {item.confidence}%
                      </td>
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        {item.trend ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-semibold whitespace-nowrap">
                        {item.market_score ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                        {item.probability != null ? `${item.probability}%` : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-800 text-gray-400 px-2.5 py-1 rounded text-xs font-mono border border-gray-700">
                          {item.timeframe}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString("pt-BR", {
                            day:    "2-digit",
                            month:  "2-digit",
                            hour:   "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRedo(item)}
                          disabled={redoingId === item.id || limitReached}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          <RefreshCw className={`w-3 h-3 ${redoingId === item.id ? "animate-spin" : ""}`} />
                          {redoingId === item.id ? "Refazendo" : "Redo"}
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
    </div>
  );
}
