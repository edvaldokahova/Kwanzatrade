"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { 
  Target, Zap, Activity, BarChart3, TrendingUp, 
  Search, ShieldCheck, PieChart as PieIcon 
} from "lucide-react";

type History = {
  id: string;
  pair: string;
  signal: string;
  confidence: number;
  created_at: string;
};

type QuantData = {
  id: string;
  pair: string;
  market_score: string;
  probability: number;
  volatility: string;
  momentum: string;
  top10: boolean;
  high_probability: boolean;
  top_volatility: boolean;
  top_momentum: boolean;
};

export default function PerformancePage() {
  const [history, setHistory] = useState<History[]>([]);
  const [quantData, setQuantData] = useState<QuantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: historyData } = await supabase
        .from("bot24_history")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: qData } = await supabase.from("bot24_quant").select("*");

      setHistory(historyData || []);
      setQuantData(qData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const buy = history.filter((h) => h.signal === "BUY").length;
  const sell = history.filter((h) => h.signal === "SELL").length;
  const chartData = [
    { name: "BUY Signals", value: buy },
    { name: "SELL Signals", value: sell },
  ];

  const top10 = quantData.filter(q => q.top10).slice(0, 5);
  const highProb = quantData.filter(q => q.high_probability).slice(0, 5);
  const topVolatility = quantData.filter(q => q.top_volatility).slice(0, 5);
  const topMomentum = quantData.filter(q => q.top_momentum).slice(0, 5);

  const COLORS = ["#3b82f6", "#ef4444"]; // Azul KwanzaTrade e Vermelho Alerta

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-12 px-4 pb-20">
      
      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <Image 
            src="/kwanzatrade-logo.svg" 
            alt="KwanzaTrade" 
            width={160} 
            height={40} 
            className="opacity-90"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <TrendingUp size={14} />
              Market Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">
              Performance <span className="text-blue-600 italic">Report</span>
            </h1>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 px-4 py-2 rounded-xl backdrop-blur-md">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Last Engine Update: </span>
          <span className="text-xs text-white font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* MÉTRICAS GERAIS (CARDS HIGHLANDER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Analyses Processed</p>
          <div className="text-5xl font-black text-white tracking-tighter">{history.length}</div>
          <Search className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <p className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Bullish Momentum</p>
          <div className="text-5xl font-black text-blue-500 tracking-tighter">{buy} <span className="text-lg text-gray-600 uppercase">Buy</span></div>
          <div className="absolute top-8 right-8 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-black border border-red-500/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <p className="text-red-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Bearish Pressure</p>
          <div className="text-5xl font-black text-red-500 tracking-tighter">{sell} <span className="text-lg text-gray-600 uppercase">Sell</span></div>
          <div className="absolute top-8 right-8 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
        </div>
      </div>

      {/* GRID DE INTELIGÊNCIA QUANT (4 COLUNAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Top 10 Trades", icon: Zap, data: top10, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
          { title: "High Probability", icon: Target, data: highProb, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
          { title: "Top Volatility", icon: Activity, data: topVolatility, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
          { title: "Top Momentum", icon: BarChart3, data: topMomentum, color: "text-blue-500", bg: "bg-blue-600/10", border: "border-blue-500/20" }
        ].map((block, i) => (
          <div key={i} className="bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] hover:border-gray-700 transition-all">
            <h3 className={`font-black flex items-center gap-2 mb-6 text-[10px] uppercase tracking-widest ${block.color}`}>
              <block.icon className="w-4 h-4" /> {block.title}
            </h3>
            <div className="space-y-4">
              {block.data.map((t) => (
                <div key={t.id} className="flex justify-between items-center group">
                  <span className="font-black text-white text-sm italic group-hover:text-blue-400 transition cursor-default">{t.pair}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${block.bg} ${block.border} ${block.color}`}>
                    {block.title === "High Probability" ? `${t.probability}%` : 
                     block.title === "Top 10 Trades" ? t.market_score : 
                     block.title === "Top Volatility" ? t.volatility : t.momentum}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ANÁLISE GRÁFICA (A PEÇA CENTRAL) */}
      <div className="bg-gray-950/50 border border-gray-800 p-10 rounded-[3rem] relative overflow-hidden shadow-3xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 mb-2">
              <PieIcon size={24} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
              Signal Distribution <br/><span className="text-gray-600 italic text-2xl">Visual Analysis</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto lg:mx-0 leading-relaxed font-medium">
              Esta distribuição reflete o viés atual do mercado baseado em dados fundamentais e algoritmos proprietários da KwanzaTrade.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                 Buy Advantage: {((buy / (buy + sell)) * 100 || 0).toFixed(1)}%
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                 Sell Pressure: {((sell / (buy + sell)) * 100 || 0).toFixed(1)}%
               </div>
            </div>
          </div>

          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  innerRadius={100}
                  paddingAngle={8}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #333', 
                    borderRadius: '20px',
                    padding: '15px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ fontWeight: '900', color: '#fff', textTransform: 'uppercase', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Overlay central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-gray-600 tracking-[0.3em] uppercase">Engine</span>
                <span className="text-4xl font-black text-white italic">AI 24</span>
            </div>
          </div>
        </div>

        {/* Decorativo de fundo */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>
      
      {/* RODAPÉ DE SEGURANÇA */}
      <div className="flex justify-center items-center gap-2 text-gray-700">
        <ShieldCheck size={14} />
        <p className="text-[10px] font-bold uppercase tracking-widest">KwanzaTrade Secure Quantitative Analysis — Confidential Data</p>
      </div>
    </div>
  );
}