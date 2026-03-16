"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Scale,
  ShieldAlert,
  Gavel,
  FileText,
  CheckCircle2,
  MessageCircle
} from "lucide-react";

export default function TermsPage() {
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
            <Scale size={14} className="text-white" />
            Legal Framework
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-left">
            Termos e Condições
            <br />
            <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              de Utilização
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            Ao acessar e utilizar a plataforma KwanzaTrade e o sistema Bot24,
            você concorda integralmente com os termos descritos nesta página.
            Nosso objetivo é garantir transparência, segurança e responsabilidade
            dentro do ecossistema de trading automatizado.
          </p>

        </section>

        {/* PRINCÍPIO */}
        <section className="grid md:grid-cols-3 gap-10">

          <div className="space-y-4">
            <ShieldAlert className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Risco de Mercado
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              O mercado Forex envolve riscos financeiros elevados. Os sinais
              fornecidos pelo Bot24 possuem natureza estatística e educativa.
              Nenhum resultado é garantido e o usuário é responsável pela
              própria gestão de capital.
            </p>
          </div>

          <div className="space-y-4">
            <Gavel className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Licença de Utilização
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              O acesso ao Bot24 é pessoal e intransferível. É proibida a
              redistribuição de sinais, revenda não autorizada, engenharia
              reversa ou tentativa de replicar os algoritmos proprietários
              da plataforma.
            </p>
          </div>

          <div className="space-y-4">
            <FileText className="w-6 h-6 text-white" />

            <h3 className="text-lg font-bold text-white">
              Transparência
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              O Bot24 utiliza inteligência artificial e análise probabilística
              para identificar oportunidades de trading. Não prometemos lucros
              garantidos, mas sim uma vantagem estatística baseada em dados
              e algoritmos.
            </p>
          </div>

        </section>

        {/* DIRETRIZES */}
        <section className="space-y-10">

          <div className="space-y-4">

            <h2 className="text-3xl font-black text-white">
              Diretrizes de Conformidade
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-400 pl-4 italic max-w-2xl">
              Ao utilizar a KwanzaTrade, o usuário reconhece que o mercado
              financeiro é volátil e que o Bot24 funciona como uma ferramenta
              de suporte à decisão, não como aconselhamento financeiro direto.
            </p>

          </div>

          <div className="space-y-6">

            {[
              {
                title: "Elegibilidade",
                desc: "A utilização da plataforma é permitida apenas para indivíduos maiores de 18 anos ou que possuam idade legal para operar no mercado financeiro em sua jurisdição."
              },
              {
                title: "Pagamentos",
                desc: "Assinaturas e serviços premium são processados através de gateways seguros. As condições de acesso são definidas no momento da compra."
              },
              {
                title: "Atualizações",
                desc: "Reservamo-nos o direito de melhorar, ajustar ou atualizar os algoritmos do Bot24 para aumentar sua performance e estabilidade."
              },
              {
                title: "Conduta",
                desc: "Usuários devem manter comportamento respeitoso em todos os canais oficiais da plataforma, incluindo suporte e comunidade."
              }
            ].map((item, i) => (

              <div key={i} className="flex gap-4">

                <CheckCircle2
                  size={18}
                  className="text-white shrink-0 mt-1"
                />

                <div>

                  <h4 className="text-white text-sm font-bold uppercase tracking-wider">
                    {item.title}
                  </h4>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-8 pt-10 border-t border-white/10">

          {/* SUPORTE */}
          <a
            href="https://wa.me/244955968159?text=Olá%20preciso%20de%20ajuda%20com%20os%20Termos%20da%20KwanzaTrade"
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
            KwanzaTrade — Plataforma tecnológica de suporte ao trading automatizado © 2026
          </p>

        </section>

      </div>
    </main>
  );
}
