"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NextLink from "next/link";

// Lucide Icons
import { 
  Activity, BarChart3, BookOpen, Users, Globe, 
  ArrowUpRight, Download, ExternalLink, Zap, LayoutDashboard 
} from "lucide-react";

export default function Dashboard() {
  const [analysesLeft, setAnalysesLeft] = useState<number | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const MAX_ANALYSES = 10; // Sincronizado com os outros arquivos (10 análises)

  useEffect(() => {
    async function fetchDailyAnalyses() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data, error } = await supabase
          .rpc("get_daily_analysis_count", { user_uuid: userData.user.id });

        if (error) {
          console.error("Erro ao buscar análises diárias:", error);
        } else {
          const count = Number(data) || 0;
          setDailyCount(count);
          setAnalysesLeft(Math.max(0, MAX_ANALYSES - count));
        }
      } catch (err) {
        console.error("Erro de conexão no Dashboard:", err);
      }
    }
    fetchDailyAnalyses();
  }, []);

  const bot24Disabled = analysesLeft !== null && analysesLeft <= 0;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      
      {/* HEADER DO DASHBOARD */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          <div className="mb-2">
            {/* Logotipo KwanzaTrade */}
            <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">K</span>
              </div>
              KWANZATRADE
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <LayoutDashboard size={14} />
              Command Center
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              Painel <span className="text-blue-600 italic">KwanzaTrade</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Bem-vindo à vanguarda do trading algorítmico.</p>
          </div>
        </div>

        {/* INDICADOR DE STATUS DA IA */}
        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl backdrop-blur-md flex items-center gap-4">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full blur-sm opacity-50"></div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Status do Bot24</p>
            <p className="text-xs text-white font-black tracking-widest">SISTEMA ONLINE</p>
          </div>
        </div>
      </header>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* CARD PRINCIPAL: BOT24 AI ANALYSIS */}
        <NextLink href={bot24Disabled ? "#" : "/bot24/analyze"} className="lg:col-span-2 group">
          <div className={`relative h-full overflow-hidden bg-gradient-to-br from-blue-900/20 to-gray-950 p-8 rounded-[2.5rem] border transition-all duration-500 
            ${bot24Disabled 
              ? "border-red-900/50 opacity-60 cursor-not-allowed" 
              : "border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] cursor-pointer"}`}
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
                    <Activity className="text-white w-6 h-6" />
                  </div>
                  <ArrowUpRight className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase leading-none">Bot24 AI Analysis</h2>
                <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                  Analise qualquer par de moedas ou ativo usando redes neurais e sentimento de mercado institucional em tempo real.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                {analysesLeft !== null ? (
                  <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase border 
                    ${analysesLeft > 0 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {analysesLeft > 0 ? `${analysesLeft} Análises Disponíveis` : "Limite Diário Atingido"}
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl text-xs font-black bg-gray-800 text-gray-500 border border-gray-700 animate-pulse">
                    Verificando Limites...
                  </div>
                )}
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Reseta às 00:00 UTC</div>
              </div>
            </div>
            
            {/* SVG Background decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity duration-700 rotate-12 pointer-events-none">
               <Activity size={200} className="text-blue-500" />
            </div>
          </div>
        </NextLink>

        {/* HEATMAP / MARKET TRENDS */}
        <NextLink href="/bot24/heatmap" className="group">
          <div className="h-full bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] hover:border-green-500/30 transition-all group cursor-pointer relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-600/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/10 group-hover:scale-110 transition-transform">
                <BarChart3 className="text-green-500 w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Market Heatmap</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Veja os pares com maior força relativa e volatilidade agora.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-green-500 tracking-[0.2em]">
                VER MAPA <ArrowUpRight size={14} />
              </div>
            </div>
          </div>
        </NextLink>

        {/* LIVE SIGNALS */}
        <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/10 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-500 w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Live AI Signals</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Receba sinais de entrada e saída gerados por algoritmos avançados.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 tracking-[0.2em]">
            EXPLORAR <ArrowUpRight size={14} />
          </div>
        </div>

        {/* EDUCAÇÃO / COMUNIDADE */}
        <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] hover:border-gray-500/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700 group-hover:scale-110 transition-transform">
            <BookOpen className="text-gray-400 w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Education Hub</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Domine o mercado com nossos cursos e materiais exclusivos.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 tracking-[0.2em]">
            ESTUDAR <ArrowUpRight size={14} />
          </div>
        </div>

        {/* HISTORY */}
        <NextLink href="/bot24/history" className="group">
          <div className="h-full bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] hover:border-yellow-500/30 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-yellow-600/10 rounded-2xl flex items-center justify-center mb-6 border border-yellow-500/10 group-hover:scale-110 transition-transform">
              <Users className="text-yellow-500 w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Trade History</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Acesse todas as suas análises passadas e trackeie sua evolução.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-yellow-500 tracking-[0.2em]">
              ACESSAR <ArrowUpRight size={14} />
            </div>
          </div>
        </NextLink>

      </div>
    </div>
  );
}
      
