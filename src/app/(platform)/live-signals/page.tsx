"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  Target, Zap, Activity, BarChart3,
  Clock, Volume2, VolumeX, RefreshCw,
  TrendingUp, TrendingDown, Minus, CalendarClock,
} from "lucide-react";

type Signal = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  timeframe: string;
  created_at: string;
  trend?: string;
  market_session?: string;
  momentum?: number;
  isTop10?: boolean;
  isHighProb?: boolean;
  isTopVol?: boolean;
  isTopMomentum?: boolean;
};

const TIMEFRAMES = ["All", "M1", "M5", "M15", "H1", "H4"];

// ─── Calcula próxima actualização (13:00 UTC = 14:00 Angola) ─────────────────

function getNextUpdateInfo(): { lastScheduled: Date; next: Date } {
  const now = new Date();

  // Próximo 13:00 UTC
  const next = new Date(now);
  next.setUTCHours(13, 0, 0, 0);
  if (now.getUTCHours() >= 13) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  // Último 13:00 UTC agendado
  const lastScheduled = new Date(next);
  lastScheduled.setUTCDate(lastScheduled.getUTCDate() - 1);

  return { lastScheduled, next };
}

function formatAngolaTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "Africa/Luanda",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAngolaDateTime(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: "Africa/Luanda",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Contador regressivo ──────────────────────────────────────────────────────

function CountdownToNext({ nextUpdate }: { nextUpdate: Date }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const diff = nextUpdate.getTime() - Date.now();
      if (diff <= 0) { setRemaining("A actualizar..."); return; }

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [nextUpdate]);

  return <span className="font-mono text-[#00FFB2] font-black">{remaining}</span>;
}

// ─── Trend icon ───────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend?: string }) {
  if (!trend) return null;
  const t = trend.toLowerCase();
  if (t === "bullish") return <TrendingUp  className="w-3.5 h-3.5 text-green-400" />;
  if (t === "bearish") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-500" />;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LiveSignals() {
  const supabase = useMemo(() => createClient(), []);

  const [signals,         setSignals]         = useState<Signal[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [isMuted,         setIsMuted]         = useState(false);
  const [lastUpdate,      setLastUpdate]      = useState<Date | null>(null);

  const lastSignalIdRef = useRef<string | null>(null);
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const isMutedRef      = useRef(isMuted);

  // Info de agendamento (recalcula uma vez por render)
  const { lastScheduled, next: nextUpdate } = getNextUpdateInfo();

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"
      );
      audioRef.current.volume = 0.4;
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      let query = supabase
        .from("live_signals")
        .select("*")
        .eq("pair", "EURUSD")
        .order("created_at", { ascending: false })
        .limit(50);

      if (timeframeFilter !== "All") {
        query = query.eq("timeframe", timeframeFilter);
      }

      const { data: signalsData, error: signalsError } = await query;
      if (signalsError) throw signalsError;

      const { data: quantData } = await supabase
        .from("bot24_quant")
        .select("pair, top10, high_probability, top_volatility, top_momentum")
        .eq("pair", "EURUSD");

      const q = quantData?.[0];

      const mappedSignals: Signal[] = (signalsData || []).map((s) => ({
        ...s,
        isTop10:       q?.top10            || false,
        isHighProb:    q?.high_probability || false,
        isTopVol:      q?.top_volatility   || false,
        isTopMomentum: q?.top_momentum     || false,
      }));

      if (mappedSignals.length > 0) {
        const newest = mappedSignals[0];
        if (
          newest.id !== lastSignalIdRef.current &&
          (newest.isHighProb || newest.confidence >= 90) &&
          !isMutedRef.current
        ) {
          audioRef.current?.play().catch(() => {});
        }
        lastSignalIdRef.current = newest.id;
      }

      setSignals(mappedSignals);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar sinais:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeframeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSignals();
    const interval = setInterval(fetchSignals, 15_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Data do sinal mais recente na BD
  const latestSignalDate = signals.length > 0
    ? new Date(signals[0].created_at)
    : null;

  return (
    <div className="relative min-h-screen">
      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/85 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <p className="text-sm font-black text-white tracking-tighter">
              KwanzaTrade <span className="text-green-500">LIVE</span>
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                IA LIVE{" "}
                <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                  SIGNAL
                </span>
              </h1>

              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">
                  Live Stream
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#00FFB2]/10 px-3 py-1 rounded-full border border-[#00FFB2]/20">
                <span className="w-1.5 h-1.5 bg-[#00FFB2] rounded-full animate-pulse" />
                <span className="text-[10px] text-[#00FFB2] font-black uppercase tracking-[0.2em]">
                  EUR/USD
                </span>
              </div>

              <button
                onClick={() => setIsMuted((p) => !p)}
                className={`p-2 rounded-xl border transition-all ${
                  isMuted
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <button
                onClick={() => { setLoading(true); fetchSignals(); }}
                className="p-2 rounded-xl border bg-gray-900 border-gray-800 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {lastUpdate && (
              <p className="text-[10px] text-gray-600 font-mono">
                Pagina actualizada:{" "}
                {lastUpdate.toLocaleTimeString("pt-BR", {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </p>
            )}
          </div>

          {/* Timeframe filter */}
          <div className="flex items-center gap-1 bg-gray-900/60 p-1.5 rounded-2xl border border-gray-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframeFilter(tf)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                  timeframeFilter === tf
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Painel de agendamento — Ultima + Proxima actualizacao */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Ultima actualizacao dos sinais */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 flex items-center gap-4">
            <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">
                Ultima actualizacao dos sinais
              </p>
              <p className="text-sm font-bold text-white">
                {latestSignalDate
                  ? formatAngolaDateTime(latestSignalDate)
                  : "Sem dados ainda"}
              </p>
              <p className="text-[9px] text-gray-600 mt-0.5">hora de Angola</p>
            </div>
          </div>

          {/* Proxima actualizacao agendada */}
          <div className="bg-[#00FFB2]/5 border border-[#00FFB2]/20 rounded-2xl px-5 py-4 flex items-center gap-4">
            <CalendarClock className="w-5 h-5 text-[#00FFB2] flex-shrink-0" />
            <div>
              <p className="text-[9px] text-[#00FFB2]/60 uppercase tracking-widest font-bold mb-0.5">
                Proxima actualizacao
              </p>
              <p className="text-sm font-bold text-white">
                {formatAngolaTime(nextUpdate)} Angola
              </p>
              <p className="text-[9px] text-gray-600 mt-0.5">
                {nextUpdate.toLocaleDateString("pt-BR", {
                  timeZone: "Africa/Luanda",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Contador regressivo */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 flex items-center gap-4">
            <RefreshCw className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">
                Tempo para proxima
              </p>
              <CountdownToNext nextUpdate={nextUpdate} />
              <p className="text-[9px] text-gray-600 mt-0.5">
                1 actualizacao por dia (plano actual)
              </p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-gray-950/60 backdrop-blur-md rounded-[2rem] border border-gray-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-5">Par</th>
                  <th className="p-5 text-center">Sinal</th>
                  <th className="p-5 text-center">Confianca</th>
                  <th className="p-5 text-center">Tendencia</th>
                  <th className="p-5 text-center">TF</th>
                  <th className="p-5 text-right">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest">
                          Scanning Market Pulse...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : signals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <p className="text-gray-500 text-xs font-bold uppercase">
                        Nenhum sinal EUR/USD para este timeframe no momento.
                      </p>
                      <p className="text-gray-600 text-[10px] normal-case mt-2">
                        O proximo sinal sera gerado as{" "}
                        <span className="text-[#00FFB2] font-bold">
                          {formatAngolaTime(nextUpdate)} (Angola)
                        </span>
                      </p>
                    </td>
                  </tr>
                ) : (
                  signals.map((s) => (
                    <tr key={s.id} className="group hover:bg-blue-600/[0.04] transition-all">

                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-xl font-black text-white group-hover:text-blue-400 transition tracking-tighter italic">
                              {s.pair}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                Bot24 Verified
                              </span>
                              {s.market_session && (
                                <span className="text-[9px] text-gray-700 font-mono ml-1">
                                  · {s.market_session}
                                </span>
                              )}
                            </div>
                          </div>
                          {s.isHighProb && (
                            <div className="bg-yellow-400/10 p-1.5 rounded-lg border border-yellow-400/20">
                              <Target className="w-4 h-4 text-yellow-500 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider ${
                          s.isHighProb
                            ? "bg-yellow-500 border-yellow-400 text-black"
                            : s.isTop10
                            ? "bg-green-600 border-green-500 text-white"
                            : s.signal?.toUpperCase().includes("BUY")
                            ? "bg-gray-900 border-green-500/30 text-green-400"
                            : "bg-gray-900 border-red-500/30 text-red-400"
                        }`}>
                          {s.isTop10  && <Zap      size={12} className="fill-current" />}
                          {s.isTopVol && <Activity size={12} />}
                          {s.signal}
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-xs font-black ${s.confidence >= 80 ? "text-yellow-400" : "text-blue-400"}`}>
                            {s.confidence}%
                          </span>
                          <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                s.confidence >= 80 ? "bg-yellow-400" : "bg-blue-500"
                              }`}
                              style={{ width: `${s.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <TrendIcon trend={s.trend} />
                          <span className={`text-[10px] font-black capitalize ${
                            s.trend === "bullish" ? "text-green-400"
                            : s.trend === "bearish" ? "text-red-400"
                            : "text-gray-500"
                          }`}>
                            {s.trend ?? "—"}
                          </span>
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <span className="bg-gray-900 text-gray-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-gray-800">
                          {s.timeframe}
                        </span>
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-600">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold font-mono">
                            {new Date(s.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
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

        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target,    label: "Alta Probabilidade (+85%)", color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/10" },
            { icon: Zap,       label: "Top 10 Forca",              color: "text-green-500",  bg: "bg-green-500/5 border-green-500/10" },
            { icon: Activity,  label: "Alta Volatilidade",         color: "text-red-500",    bg: "bg-red-500/5 border-red-500/10" },
            { icon: BarChart3, label: "Momentum IA",               color: "text-blue-500",   bg: "bg-blue-500/5 border-blue-500/10" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${item.bg}`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
