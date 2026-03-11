"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  Lock,
  Server,
  FileText,
  CheckCircle2,
  MessageCircle
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="bg-[#0b0b0c] text-gray-200 min-h-screen selection:bg-blue-500/30">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/5 blur-[140px] rounded-full"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-24 space-y-24">

        {/* HEADER */}
        <section className="space-y-8">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-[0.25em]">
            <ShieldCheck size={14} className="text-white" />
            Data Protection
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-left">
            Política de
            <br />
            <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              Privacidade
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            Na KwanzaTrade, a proteção de dados não é apenas uma exigência legal.
            É um compromisso com a confiança que você deposita em nossa
            tecnologia e em nosso sistema de inteligência artificial Bot24.
          </p>

        </section>

        {/* PRINCÍPIOS */}
        <section className="grid md:grid-cols-3 gap-10">

          <div className="space-y-4">
            <Lock className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Criptografia Total
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              Utilizamos protocolos de criptografia avançados para proteger
              todas as informações dos usuários. Os dados são transmitidos
              através de conexões seguras e armazenados em ambientes protegidos.
            </p>
          </div>

          <div className="space-y-4">
            <Eye className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Transparência
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              Coletamos apenas as informações necessárias para o funcionamento
              da plataforma e para melhorar a experiência do usuário dentro
              do ecossistema KwanzaTrade.
            </p>
          </div>

          <div className="space-y-4">
            <Server className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Uso Ético de Dados
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              Não vendemos, alugamos ou compartilhamos dados pessoais com
              terceiros. Todas as informações são utilizadas exclusivamente
              para melhorar o desempenho da plataforma.
            </p>
          </div>

        </section>

        {/* DIRETRIZES */}
        <section className="space-y-10">

          <div className="space-y-4">

            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <FileText className="text-white" />
              Diretrizes de Proteção
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-400 pl-4 italic max-w-2xl">
              A KwanzaTrade implementa práticas modernas de segurança
              digital para garantir que os dados dos usuários sejam
              protegidos contra acesso não autorizado.
            </p>

          </div>

          <div className="space-y-6">

            {[
              "Coleta mínima de dados para autenticação e funcionamento da plataforma.",
              "Histórico de sinais armazenado em servidores protegidos.",
              "Registros de atividade removidos periodicamente para maior segurança.",
              "Aplicação de padrões internacionais de proteção de dados."
            ].map((item, i) => (

              <div key={i} className="flex gap-4">

                <CheckCircle2
                  size={18}
                  className="text-white shrink-0 mt-1"
                />

                <p className="text-gray-400 text-sm leading-relaxed">
                  {item}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* COMPROMISSO */}
        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">

          <h4 className="text-white font-bold mb-4">
            Compromisso KwanzaTrade
          </h4>

          <p className="text-gray-400 text-sm leading-relaxed italic">
            "Garantimos que todas as informações processadas pelo sistema
            Bot24 são utilizadas exclusivamente para melhorar a experiência
            e a segurança dos nossos usuários dentro da plataforma."
          </p>

          <div className="mt-6 flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-black">
              KT
            </div>

            <div>
              <p className="text-white text-xs font-black uppercase">
                Conselho de Segurança
              </p>
              <p className="text-gray-500 text-[10px]">
                KwanzaTrade — Luanda
              </p>
            </div>

          </div>

        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-8 pt-10 border-t border-white/10">

          {/* SUPORTE */}
          <a
            href="https://wa.me/244955968159?text=Olá%20preciso%20de%20ajuda%20com%20a%20política%20de%20privacidade%20da%20KwanzaTrade"
            target="_blank"
            className="flex items-center gap-3 text-gray-300 bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 transition"
          >
            <MessageCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Falar com Suporte
            </span>
          </a>

          {/* BOT24 */}
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-[0_0_40px_rgba(255,255,255,0.25)]"
          >
            Começar a operar com Bot24
          </Link>

          {/* LOGO */}
          <div className="opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <Image
              src="/kwanzatrade-logo.svg"
              alt="KwanzaTrade Seal"
              width={120}
              height={30}
            />
          </div>

          <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium text-center">
            Última atualização: Março de 2026
          </p>

        </section>

      </div>
    </main>
  );
}