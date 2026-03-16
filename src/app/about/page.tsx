"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, Cpu, BookOpen, Globe, Rocket, ShieldCheck, Zap, MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-[#0b0b0c] text-gray-200 min-h-screen selection:bg-blue-500/30">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/5 blur-[140px] rounded-full"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-24 space-y-24">

        {/* HERO */}
        <section className="space-y-8">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-[0.25em]">
            <Zap size={14} className="text-white" />
            A Próxima Geração do Trading
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-left">
            Nós não apenas seguimos o mercado. <br />
            <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              Nós o deciframos.
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            A KwanzaTrade é a convergência entre inteligência artificial de ponta e a visão estratégica do trader angolano. Criamos um ecossistema onde a tecnologia trabalha para você, não o contrário.
          </p>
        </section>

        {/* GRID DE VALORES */}
        <div className="grid md:grid-cols-3 gap-10">

          {/* Tecnologia */}
          <div className="space-y-4">
            <Cpu className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">Bot24 Engine</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nossa IA proprietária analisa bilhões de pontos de dados por segundo, identificando padrões invisíveis ao olho humano. O Bot24 é o seu analista institucional pessoal, operando 24/7.
            </p>
          </div>

          {/* Comunidade */}
          <div className="space-y-4">
            <Users className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">Ecossistema Elite</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Mais que uma comunidade, somos uma rede de inteligência coletiva. Conectamos traders angolanos a mercados globais, promovendo a troca de estratégias de alto nível.
            </p>
          </div>

          {/* Educaçao */}
          <div className="space-y-4">
            <BookOpen className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">Kwanza Academy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Conhecimento é capital. Oferecemos treinamentos estruturados que vão do zero ao domínio avançado em gestão de risco e análise quantitativa.
            </p>
          </div>

        </div>

        {/* SEÇÃO "POR QUE NÓS" */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-gray-900/20 border border-gray-800/50 p-10 rounded-[40px]">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              A Diferença <br /> <span className="text-gray-200">KwanzaTrade.</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-white" />
                <p className="text-gray-300 font-medium">Foco absoluto em segurança e gestão de risco.</p>
              </div>
              <div className="flex items-start gap-4">
                <Globe className="w-6 h-6 text-white" />
                <p className="text-gray-300 font-medium">Plataforma otimizada para a realidade do investidor em Angola.</p>
              </div>
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-white" />
                <p className="text-gray-300 font-medium">Dados em tempo real com baixa latência.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-[#0b0b0c] border border-white/10 p-10 rounded-3xl text-center space-y-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <Rocket className="w-12 h-12 text-white mx-auto animate-bounce" />
              <h4 className="text-2xl font-black text-white italic tracking-tighter">PRONTO PARA O PRÓXIMO NÍVEL?</h4>
              <p className="text-gray-400 text-sm">Junte-se a milhares de traders que já operam com a vantagem da IA.</p>
              <Link
                href="/login"
                className="inline-block bg-white text-black font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition shadow-xl uppercase tracking-widest text-xs"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </section>

        {/* CTA SUPORTE + LOGO */}
        <section className="flex flex-col items-center gap-8 pt-10 border-t border-white/10">
          <a
            href="https://wa.me/244955968159?text=Olá%20preciso%20de%20ajuda%20com%20a%20página%20sobre%20KwanzaTrade"
            target="_blank"
            className="flex items-center gap-3 text-gray-300 bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 transition"
          >
            <MessageCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Falar com Suporte
            </span>
          </a>

          <div className="opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <Image
              src="/kwanzatrade-logo.svg"
              alt="KwanzaTrade Seal"
              width={120}
              height={30}
            />
          </div>

          <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium text-center">
            KwanzaTrade — Plataforma tecnológica de suporte ao trading automatizado © 2026
          </p>
        </section>

      </div>
    </main>
  );
}
