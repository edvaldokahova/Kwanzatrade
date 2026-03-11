"use client";

import Image from "next/image"; // Corrigido de "Link" para "Image" para evitar conflito
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
  const MAX_ANALYSES = 4;

  useEffect(() => {
    async function fetchDailyAnalyses() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .rpc("get_daily_analysis_count", { user_uuid: userData.user.id });

      if (error) console.error("Erro ao buscar análises diárias:", error);
      else setAnalysesLeft(MAX_ANALYSES - Number(data));
    }
    fetchDailyAnalyses();
  }, []);

  const bot24Disabled = analysesLeft !== null && analysesLeft <= 0;

  return (
    <div className="space-y-12 pb-20">
      
      {/* HEADER DO DASHBOARD */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          {/* LOGOTIPO ADICIONADO AQUI */}
          <div className="mb-2">
            <Image 
              src="/kwanzatrade-logo.svg" 
              alt="KwanzaTrade" 
              width={160} 
              height={40} 
              className="opacity-90"
            />
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

        {/* BOT24 AI ANALYSIS - O CARD DESTAQUE */}
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
                {analysesLeft !== null && (
                  <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase border 
                    ${analysesLeft > 0 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {analysesLeft > 0 ? `${analysesLeft} Análises Disponíveis` : "Limite Diário Atingido"}
                  </div>
                )}
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Reseta em 24h</div>
              </div>
            </div>
            
            {/* SVG Background decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-25 transition-opacity duration-700 rotate-12">
               <img src="/bot24.svg" alt="" className="w-64 h-auto" />
            </div>
          </div>
        </NextLink>

        {/* ... (restante dos cards mantendo o mesmo estilo) */}
        
        {/* LIVE SIGNALS */}
        <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/10 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-500 w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Live AI Signals</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Receba sinais de entrada e saída gerados por múltiplos algoritmos.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 tracking-[0.2em]">
            EXPLORAR <ArrowUpRight size={14} />
          </div>
        </div>

        {/* (O restante do código segue a lógica anterior com os ajustes de border-radius para 2.5rem para um look mais moderno) */}
        {/* ... */}

      </div>
    </div>
  );
}