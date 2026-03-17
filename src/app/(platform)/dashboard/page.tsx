"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import NextLink from "next/link";
import { ArrowUpRight, LayoutDashboard } from "lucide-react";

const MAX_ANALYSES = 10;

export default function Dashboard() {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [analysesLeft, setAnalysesLeft] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDailyAnalyses() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data } = await supabase.rpc("get_daily_analysis_count", {
          user_uuid: userData.user.id,
        });

        setAnalysesLeft(Math.max(0, MAX_ANALYSES - (Number(data) || 0)));
      } catch (err) {
        console.error(err);
      }
    }

    fetchDailyAnalyses();
  }, [supabase]);

  const bot24Disabled = analysesLeft !== null && analysesLeft <= 0;

  return (
    <div className="pt-4 px-6 md:px-10 space-y-8 pb-24 max-w-7xl mx-auto">
      
      {/* HEADER */}
      {/* Adicionei mt-20 logo abaixo para empurrar tudo para baixo */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-20">
        <div className="space-y-4">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-[0.35em]">
              <LayoutDashboard size={14} />
              Command Center
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              Painel <span className="text-gray-500">KwanzaTrade</span>
            </h1>
            <p className="text-gray-500 text-sm">
              Bem-vindo à vanguarda do trading algorítmico.
            </p>
          </div>
        </div>

        <div className="bg-[#111] border border-green-500/20 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full blur-sm opacity-50" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Status do Bot24</p>
            <p className="text-xs text-white font-black tracking-widest">SISTEMA ONLINE</p>
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* BOT24 */}
        <NextLink
          href={bot24Disabled ? "/bot24" : "/bot24/analyze"}
          className="lg:col-span-2 group"
        >
          <div
            className={`bg-gradient-to-br from-green-900/20 to-[#0d0d0d] p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${
              bot24Disabled
                ? "border-gray-700 opacity-60 cursor-not-allowed"
                : "border-green-500/30 hover:border-green-400 hover:shadow-[0_0_50px_rgba(34,197,94,0.25)]"
            }`}
          >
            <Image
              src="/bot24_an.svg"
              alt="Bot24"
              width={120}
              height={120}
              className="mb-6 opacity-90"
            />
            <h2 className="text-3xl font-black text-white mb-3 uppercase">
              Bot24 AI Analysis
            </h2>
            <p className="text-gray-400 text-sm">
              Analise qualquer ativo usando redes neurais e sentimento institucional.
            </p>
            <div className="mt-8">
              {analysesLeft !== null ? (
                <div
                  className={`inline-block px-4 py-2 rounded-xl text-xs font-black uppercase border ${
                    bot24Disabled
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {bot24Disabled
                    ? "Limite diário atingido"
                    : `${analysesLeft} análises restantes hoje`}
                </div>
              ) : (
                <div className="inline-block px-4 py-2 rounded-xl text-xs font-black bg-gray-800 text-gray-500 border border-gray-700 animate-pulse">
                  Verificando...
                </div>
              )}
            </div>
          </div>
        </NextLink>

        {/* HEATMAP */}
        <NextLink href="/bot24/heatmap" className="group">
          <div className="bg-[#111] border border-gray-800 p-8 rounded-[2.5rem] hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all hover:scale-[1.02] h-full">
            <Image src="/heatmap.svg" alt="Heatmap" width={100} height={100} className="mb-6 opacity-90" />
            <h2 className="text-xl font-black text-white mb-2 uppercase">Market Heatmap</h2>
            <p className="text-gray-500 text-sm mb-6">Veja os pares com maior força relativa.</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-green-500 tracking-[0.2em]">
              Ver mapa <ArrowUpRight size={14} />
            </div>
          </div>
        </NextLink>

        {/* LIVE SIGNALS */}
        <NextLink href="/live-signals" className="group">
          <div className="bg-[#111] border border-gray-800 p-8 rounded-[2.5rem] hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all hover:scale-[1.02]">
            <Image src="/live-signals.svg" alt="Signals" width={100} height={100} className="mb-6 opacity-90" />
            <h2 className="text-xl font-black text-white mb-2 uppercase">Live AI Signals</h2>
            <p className="text-gray-500 text-sm">Sinais institucionais gerados por IA.</p>
          </div>
        </NextLink>

        {/* EDUCATION */}
        <div className="bg-[#111] border border-gray-800 p-8 rounded-[2.5rem] hover:border-gray-500/30 transition-all hover:scale-[1.02]">
          <Image src="/education.svg" alt="Education" width={100} height={100} className="mb-6 opacity-90" />
          <h2 className="text-xl font-black text-white mb-3 uppercase">Education Hub</h2>
          <p className="text-gray-500 text-sm mb-6">
            Aprenda trading com um dos maiores brokers do mundo.
          </p>
          <Image src="/xm-logo.png" alt="XM" width={120} height={40} className="mb-6" />
          <a
            href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=29"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Começar treinamento
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* WHATSAPP FLOAT */}
      <a
        href="https://wa.me/244955968159"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="w-16 h-16 bg-[#0d0d0d] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(200,200,200,0.35)] hover:scale-110 transition-all relative">
          <Image 
            src="/W-icon.png" 
            alt="WhatsApp"
            width={32} 
            height={32}
            className="object-contain block" 
          />
        </div>
      </a>
    </div>
  );
}
