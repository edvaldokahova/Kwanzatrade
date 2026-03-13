"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { runBot24Analysis } from "@/lib/bot24Analysis";
import { saveBot24Request } from "@/lib/saveBot24Request";
import { saveBot24History } from "@/lib/saveBot24History";
import { useLoader } from "@/context/LoaderContext";

const XM_LINKS = {
  beginner: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5",
  advanced: "https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=1",
};

export default function Bot24Analyze() {

  const { showLoader, hideLoader } = useLoader();

  const [pair, setPair] = useState("");
  const [capital, setCapital] = useState(100);
  const [timeframe, setTimeframe] = useState("H1");
  const [traderLevel, setTraderLevel] = useState("beginner");
  const [risk, setRisk] = useState(2);

  const [result, setResult] = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [topSignal, setTopSignal] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any[]>([]);

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

    if (analysisCount >= 10) {
      alert("Você atingiu o limite diário de 10 análises.");
      return;
    }

    showLoader();

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

    hideLoader();
  }

  const getXMButtonLink = () => {
    if (traderLevel === "beginner") return XM_LINKS.beginner;
    return XM_LINKS.advanced;
  };

  const calculateProfit = () => {

    if (!result) return 0;

    const riskAmount = capital * (risk / 100);

    const rr = 2;

    return (riskAmount * rr).toFixed(2);
  };

  return (

    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}

      <div className="flex items-center gap-4">

        <Image
          src="/bot24.svg"
          alt="Bot24"
          width={60}
          height={60}
        />

        <div>

          <h1 className="text-4xl font-bold">
            Bot24 AI Analysis
          </h1>

          <p className="text-gray-400">
            Inteligência de mercado automatizada baseada em IA
          </p>

        </div>

      </div>

      {/* STATS */}

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">

          <p className="text-gray-400 text-sm">
            Accuracy Bot24
          </p>

          <p className="text-3xl font-bold text-green-400">
            73%
          </p>

        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">

          <p className="text-gray-400 text-sm">
            Top Signal Today
          </p>

          {topSignal && (

            <p className="text-xl font-bold">

              {topSignal.pair}
              {" "}
              {topSignal.signal}
              {" "}
              {topSignal.confidence}%

            </p>

          )}

        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">

          <p className="text-gray-400 text-sm">
            Daily Analyses
          </p>

          <p className="text-3xl font-bold">
            {analysisCount}/10
          </p>

        </div>

      </div>

      {/* MARKET SENTIMENT */}

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">

        <h3 className="text-lg font-bold mb-4">
          Live Market Sentiment
        </h3>

        <div className="space-y-3">

          {sentiment.map((item, i) => (

            <div
              key={i}
              className="flex justify-between bg-gray-900 p-3 rounded"
            >

              <span className="font-semibold">
                {item.pair}
              </span>

              <span
                className={`font-bold ${
                  item.signal === "BUY"
                    ? "text-green-400"
                    : item.signal === "SELL"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >

                {item.signal}
                {" "}
                {item.confidence}%

              </span>

            </div>

          ))}

        </div>

      </div>

      {/* FORM */}

      <div className="grid md:grid-cols-5 gap-4 bg-gray-800 border border-gray-700 p-6 rounded-xl">

        <input
          placeholder="Pair"
          value={pair}
          onChange={(e) =>
            setPair(e.target.value.toUpperCase())
          }
          className="bg-gray-900 p-3 rounded"
        />

        <input
          type="number"
          value={capital}
          onChange={(e) =>
            setCapital(Number(e.target.value))
          }
          className="bg-gray-900 p-3 rounded"
        />

        <select
          value={timeframe}
          onChange={(e) =>
            setTimeframe(e.target.value)
          }
          className="bg-gray-900 p-3 rounded"
        >

          {[
            "M5",
            "M15",
            "M30",
            "H1",
            "H4",
            "D1"
          ].map((tf) => (

            <option key={tf}>
              {tf}
            </option>

          ))}

        </select>

        <select
          value={traderLevel}
          onChange={(e) =>
            setTraderLevel(e.target.value)
          }
          className="bg-gray-900 p-3 rounded"
        >

          <option value="beginner">
            Beginner
          </option>

          <option value="intermediate">
            Intermediate
          </option>

          <option value="advanced">
            Advanced
          </option>

        </select>

        <input
          type="number"
          value={risk}
          onChange={(e) =>
            setRisk(Number(e.target.value))
          }
          className="bg-gray-900 p-3 rounded"
        />

      </div>

      <button
        onClick={handleAnalyze}
        className="bg-green-500 hover:bg-green-600 transition px-8 py-3 rounded-lg font-semibold"
      >
        Run AI Analysis
      </button>

      {/* RESULT */}

      {result && (

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">

          <h2 className="text-2xl font-bold">
            Analysis Result
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <div className="bg-gray-900 p-4 rounded">

              <p className="text-gray-400">
                Pair
              </p>

              <p className="text-xl font-bold">
                {result.pair}
              </p>

            </div>

            <div className="bg-gray-900 p-4 rounded">

              <p className="text-gray-400">
                Signal
              </p>

              <p
                className={`text-xl font-bold ${
                  result.signal === "BUY"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {result.signal}
              </p>

            </div>

            <div className="bg-gray-900 p-4 rounded">

              <p className="text-gray-400">
                Confidence
              </p>

              <p className="text-xl font-bold">
                {result.confidence}%
              </p>

            </div>

          </div>

          {/* CONFIDENCE BAR */}

          <div>

            <p className="text-sm text-gray-400 mb-2">
              Bot24 Confidence
            </p>

            <div className="w-full bg-gray-700 rounded h-4">

              <div
                className="bg-green-500 h-4 rounded"
                style={{
                  width: `${result.confidence}%`
                }}
              />

            </div>

          </div>

          {/* TRADE SETUP */}

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">

            <h3 className="font-bold mb-3">
              Trade Setup
            </h3>

            <p>
              Entry: {result.entry}
            </p>

            <p className="text-red-400">
              Stop Loss: {result.stopLoss}
            </p>

            <p className="text-green-400">
              Take Profit: {result.takeProfit}
            </p>

          </div>

          {/* PROFIT SIMULATION */}

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">

            <h3 className="font-bold mb-2">
              Profit Simulation
            </h3>

            <p className="text-gray-400 text-sm">
              Capital: ${capital}
            </p>

            <p className="text-gray-400 text-sm">
              Risk: {risk}%
            </p>

            <p className="text-green-400 text-xl font-bold mt-2">
              Potential Profit: +${calculateProfit()}
            </p>

          </div>

          <a
            href={getXMButtonLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
          >

            {traderLevel === "beginner"
              ? "Open XM Demo"
              : "Open XM Real"}

          </a>

        </div>

      )}

    </div>

  );
}
