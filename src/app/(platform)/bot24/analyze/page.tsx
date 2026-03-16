"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24Request } from "@/lib/saveBot24Request";
import { saveBot24History } from "@/lib/saveBot24History";
import { useLoader } from "@/context/LoaderContext";

const supabase = createClient();

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

const TOP_PAIRS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD",
  "USDCAD","NZDUSD","EURGBP","EURJPY","GBPJPY",
  "AUDJPY","AUDNZD","EURCHF","EURAUD","GBPCHF",
  "USDSEK","USDNOK","USDTRY","USDMXN","EURCAD"
];

const TIMEFRAMES = ["M1","M2","M3","M4","M5","M15","M30","H1","H4","D1","W1"];

export default function Bot24Analyze() {

  const { startLoading, stopLoading } = useLoader();

  const [pair, setPair] = useState("");
  const [capital, setCapital] = useState(100);
  const [timeframe, setTimeframe] = useState("H1");
  const [traderLevel, setTraderLevel] = useState("beginner");
  const [risk, setRisk] = useState(2);

  const [result, setResult] = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [topSignal, setTopSignal] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {

    async function loadStats() {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc(
        "get_daily_analysis_count",
        { user_uuid: user.id }
      );

      setAnalysisCount(data || 0);

      const { data: profile } = await supabase
        .from("users")
        .select("trader_level")
        .eq("id", user.id)
        .single();

      if (profile?.trader_level) {
        setTraderLevel(profile.trader_level);
      }

      const { data: signal } = await supabase
        .from("forex_heatmap")
        .select("*")
        .order("confidence", { ascending: false })
        .limit(1)
        .single();

      setTopSignal(signal);

      const { data: sentimentData } = await supabase
        .from("forex_heatmap")
        .select("*")
        .order("confidence", { ascending: false })
        .limit(3);

      setSentiment(sentimentData || []);
    }

    loadStats();

  }, []);

  async function handleAnalyze() {

    if (!pair.trim()) return;

    if (isAnalyzing) return;

    if (analysisCount >= 10) {
      alert("Você atingiu o limite diário de 10 análises.");
      return;
    }

    setIsAnalyzing(true);

    startLoading();

    try {

      await saveBot24Request({
        pair,
        timeframe,
        capital,
        risk_percent: risk,
        trader_level: traderLevel
      });

      const analysis = await runBot24Analysis({
        pair,
        capital,
        timeframe,
        traderLevel,
        risk
      });

      await saveBot24History(analysis);

      setResult(analysis);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {

        const { data } = await supabase.rpc(
          "get_daily_analysis_count",
          { user_uuid: user.id }
        );

        setAnalysisCount(data || 0);
      }

    } catch (error) {

      console.error(error);
      alert("Erro ao gerar análise.");

    }

    stopLoading();
    setIsAnalyzing(false);
  }

  const getXMButtonLink = () => {

    const base =
      traderLevel === "beginner"
        ? XM_LINKS.beginner
        : XM_LINKS.advanced;

    if (!result?.pair) return base;

    return `${base}&symbol=${result.pair}`;
  };

  const calculateProfit = () => {

    if (!result) return 0;

    const riskAmount = capital * (risk / 100);
    const rr = 2;

    return (riskAmount * rr).toFixed(2);
  };

  return (

    <div className="relative min-h-screen">

      <Image
        src="/hero-b.webp"
        alt="Background"
        fill
        priority
        className="object-cover opacity-10"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-black"></div>

      <div className="relative max-w-6xl mx-auto space-y-10 py-10 px-4">

        <div className="flex items-center gap-4">

          <Image
            src="/bot24_an.svg"
            alt="Bot24"
            width={60}
            height={60}
          />

          <div>

            <h1 className="text-4xl font-bold">
              Bot24 Analysis
            </h1>

            <p className="text-gray-400">
              Inteligência de mercado automatizada baseada em IA
            </p>

          </div>

        </div>

        <div className="grid md:grid-cols-4 gap-4">

          <select
            value={pair}
            onChange={(e)=>setPair(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded p-3"
          >
            <option value="">Select Pair</option>
            {TOP_PAIRS.map(p=>(
              <option key={p}>{p}</option>
            ))}
          </select>

          <select
            value={timeframe}
            onChange={(e)=>setTimeframe(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded p-3"
          >
            {TIMEFRAMES.map(t=>(
              <option key={t}>{t}</option>
            ))}
          </select>

          <input
            type="number"
            value={capital}
            onChange={(e)=>setCapital(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded p-3"
            placeholder="Capital"
          />

          <input
            type="number"
            value={risk}
            onChange={(e)=>setRisk(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded p-3"
            placeholder="Risk %"
          />

        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`px-8 py-3 rounded-lg font-semibold transition ${
            isAnalyzing
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
        </button>

        {result && (

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">

            <h2 className="text-2xl font-bold">
              Analysis Result
            </h2>

            <div className="grid md:grid-cols-3 gap-4">

              <div className="bg-gray-900 p-4 rounded">
                <p className="text-gray-400">Pair</p>
                <p className="text-xl font-bold">{result.pair}</p>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <p className="text-gray-400">Signal</p>
                <p className={`text-xl font-bold ${
                  result.signal === "BUY"
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {result.signal}
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <p className="text-gray-400">Confidence</p>
                <p className="text-xl font-bold">
                  {result.confidence}%
                </p>
              </div>

            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">

              <p className="text-gray-400 text-sm">
                Potential Profit (RR 1:2)
              </p>

              <p className="text-2xl font-bold text-green-400">
                ${calculateProfit()}
              </p>

            </div>

            <a
              href={getXMButtonLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block px-6 py-3 rounded-lg font-bold ${
                result.signal === "BUY"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Criar ordem {result.signal} na XM
            </a>

          </div>

        )}

      </div>

    </div>
  );
}
