"use client";

import Image from "next/image";
import { Check, X, ArrowRight, MessageCircle, LogIn, User, Brain, BarChart2, Shield, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showNavbar, setShowNavbar] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pipelineRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<{ top: number; height: number }>({ top: 0, height: 0 });

  useEffect(() => {
    const updateLine = () => {
      if (!pipelineRef.current) return;
      const circles = pipelineRef.current.querySelectorAll("[data-circle]");
      if (circles.length < 2) return;
      const first = circles[0].getBoundingClientRect();
      const last  = circles[circles.length - 1].getBoundingClientRect();
      const container = pipelineRef.current.getBoundingClientRect();
      const top    = first.bottom - container.top;
      const height = (last.top - container.top) - top;
      setLineStyle({ top, height });
    };
    updateLine();
    window.addEventListener("resize", updateLine);
    return () => window.removeEventListener("resize", updateLine);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 150) {
        setShowNavbar(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowNavbar(false), 10000);
      } else {
        setShowNavbar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-gray-200 overflow-hidden">

      {/* NAVBAR DINAMICA */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#0b0b0c]/90 backdrop-blur-xl border-b border-gray-800/50 transition-all duration-500 transform ${
        showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src="/kt-icon.png" alt="KwanzaTrade" width={34} height={34} className="rounded-lg" />
          <div className="flex items-center">
            {user ? (
              <a href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                <User size={16} /> Cockpit
              </a>
            ) : (
              <a href="/auth/login" className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-xl transition font-semibold text-sm">
                <LogIn size={15} /> Entrar
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <video src="/fundo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0b0c]" />
        </div>

        {/* Glow ambiental */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-32">
          <Image src="/kwanzatrade-logo.svg" alt="Kwanzatrade" width={180} height={36} className="mb-12 opacity-90" />

          {/* Eyebrow */}
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-semibold mb-6">
            Inteligência de mercado para traders angolanos
          </p>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-3xl">
            Pare de perder dinheiro{" "}
            <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
              enquanto analisa.
            </span>
          </h1>

          <p className="mt-8 text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed">
            O BOT24 processa o EUR/USD em tempo real e entrega Entry, SL, TP e lote
            calculado em menos de 2 segundos — usando os frameworks dos maiores traders da história.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <a
              href="/auth/login"
              className="bg-white text-black px-8 py-4 rounded-xl font-bold transition hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.12)] text-sm"
            >
              Começar gratuitamente
            </a>
            <a
              href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-gray-700 px-8 py-4 rounded-xl hover:bg-white/5 hover:border-gray-500 transition text-sm font-medium"
            >
              Ganhar $30 sem depósito <ArrowRight size={16} />
            </a>
          </div>

          {/* Social proof micro */}
          <p className="mt-10 text-xs text-gray-600">
            Usado por traders em Angola · Gratuito · Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* ─── SOBRE ────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-20">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-semibold mb-5">
              O que é a KwanzaTrade
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-3xl mx-auto">
              A inteligência que os traders profissionais{" "}
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
                nunca partilharam.
              </span>
            </h2>
            <p className="mt-6 text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Combinamos dados reais de mercado com os frameworks dos maiores traders da história
              — processados pelo <span className="text-white font-semibold">Gemini 2.5 Flash</span> da Google
              para qualquer trader angolano operar com precisão institucional.
            </p>
          </div>

          {/* Pipeline visual */}
          <div className="relative max-w-2xl mx-auto mb-24">
            <p className="text-center text-[10px] text-gray-700 uppercase tracking-[0.3em] font-bold mb-14">
              Como funciona
            </p>

            <div ref={pipelineRef} className="relative">
              {lineStyle.height > 0 && (
                <div
                  className="absolute left-[26px] w-[2px] bg-gray-800/60 overflow-hidden"
                  style={{ top: lineStyle.top, height: lineStyle.height }}
                >
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-flow" />
                </div>
              )}

              <div className="space-y-6">
                {[
                  { num: "01", label: "Coleta",       title: "Dados em Tempo Real",   desc: "Conexão direta com Alpha Vantage, Marketaux e Frankfurter para capturar cada tick do EUR/USD.", color: "border-blue-500/20" },
                  { num: "02", label: "Processamento", title: "Frameworks Lendários",  desc: "Aplicamos as teorias de reflexividade de George Soros para identificar desequilíbrios de liquidez.", color: "border-purple-500/20" },
                  { num: "03", label: "Inteligência",  title: "Cérebro Gemini 2.5",   desc: "A IA processa o sentimento das notícias e o price action em milissegundos para filtrar ruídos.", color: "border-cyan-500/20" },
                  { num: "04", label: "Execução",      title: "Sinal Pronto",          desc: "Recebes Entry, SL, TP e o lote exato calculado para a tua banca. Sem hesitação, sem ruído.", color: "border-green-500/20" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-6 group">
                    <div
                      data-circle
                      className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full border border-gray-800 bg-[#0b0b0c] flex items-center justify-center text-sm font-bold text-gray-500 group-hover:border-gray-600 group-hover:text-gray-300 transition-all duration-400"
                    >
                      {step.num}
                    </div>
                    <div className={`flex-1 p-6 rounded-2xl border ${step.color} bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300`}>
                      <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-600 mb-1">{step.label}</p>
                      <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOT24 — texto corrido, sem card */}
          <div className="max-w-2xl mx-auto mb-20">
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              O BOT24 analisa o par mais líquido do mundo usando o framework de{" "}
              <span className="text-white font-semibold">George Soros</span> — reflexividade de mercado,
              caça a liquidez e gestão de risco assimétrica. Recebes Entry, Stop Loss, Take Profit
              e lote calculado em menos de 2 segundos.
            </p>
            <div className="space-y-3">
              {[
                "Framework George Soros — Reflexividade de mercado",
                "Dados reais Alpha Vantage + notícias MarketAux",
                "Alerta Conta Micro para capitais baixos",
                "Timer de validade da análise por timeframe",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                  <Check size={13} className="text-gray-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* 4 pilares */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Brain,     color: "text-purple-400", bg: "bg-purple-400/8 border-purple-400/15",  label: "IA Institucional", desc: "Gemini 2.5 Flash com décadas de conhecimento de trading" },
              { icon: BarChart2, color: "text-blue-400",   bg: "bg-blue-400/8 border-blue-400/15",      label: "Dados Reais",      desc: "Alpha Vantage, MarketAux, Frankfurter/BCE" },
              { icon: Shield,    color: "text-green-400",  bg: "bg-green-400/8 border-green-400/15",    label: "Risco Controlado", desc: "SL obrigatório, lote calculado, contexto inteligente" },
              { icon: Clock,     color: "text-[#F7931A]",  bg: "bg-[#F7931A]/8 border-[#F7931A]/15",    label: "2 Segundos",       desc: "Da análise ao sinal — mais rápido que qualquer trader" },
            ].map(({ icon: Icon, color, bg, label, desc }, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${bg} text-center`}>
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-sm font-bold ${color} mb-1`}>{label}</p>
                <p className="text-[10px] text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── BOT24 ────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-semibold mb-5">
              Conheça o motor
            </p>
            <div className="flex justify-center mb-8">
              <Image src="/bot.png" alt="Bot" width={120} height={120} className="opacity-85" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">BOT24</span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
              Observa o EUR/USD sem parar. Filtra o ruído. Entrega sinais estruturados
              para operar com confiança — mesmo sem experiência.
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-16 mb-16">
            {[
              { value: "< 2s", label: "Por análise" },
              { value: "100%", label: "Gratuito"    },
              { value: "24/7", label: "Activo"      },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Video */}
          <div className="mx-auto mb-16 relative max-w-[480px] w-full rounded-2xl overflow-hidden border border-gray-800/60 shadow-[0_0_60px_rgba(59,130,246,0.15)]">
            <video src="/signail.mp4" autoPlay loop muted playsInline className="w-full h-auto opacity-90" />
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: BarChart2, title: "Análise Contínua",     desc: "Monitoriza o EUR/USD em tempo real, processando price action e sentimento de mercado sem interrupção." },
              { icon: Brain,     title: "Inteligência Filtrada", desc: "Alpha Vantage, MarketAux e Frankfurter processados pelo Gemini 2.5 Flash para eliminar o ruído." },
              { icon: Clock,     title: "Sinal em 2 Segundos",  desc: "Entry, SL e TP calculados ao detalhe. Mais rápido que qualquer análise manual." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white/[0.02] p-7 rounded-2xl border border-gray-800/50 hover:border-gray-700 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/15 mb-5">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2 text-sm">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── COMPARAÇÃO ───────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-semibold mb-5">
              Comparação honesta
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Porque não usar outra plataforma?
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-800/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="p-4 text-left text-gray-600 font-medium text-xs uppercase tracking-widest"></th>
                  <th className="p-4 text-center text-white font-bold text-xs uppercase tracking-widest">KwanzaTrade</th>
                  <th className="p-4 text-center text-gray-600 font-medium text-xs uppercase tracking-widest">Outras</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {[
                  ["Preço",      "Gratuito",     "+14$/mês"    ],
                  ["Velocidade", "Instantânea",  "Moderada"    ],
                  ["Sinais",     "Estruturados", "Técnicos"    ],
                  ["Condição",   "Nenhuma",      "Experiência" ],
                  ["Tempo",      "Minutos",      "Horas"       ],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-gray-800/40">
                    <td className="p-4 text-gray-500 text-sm">{row[0]}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 text-green-400 text-sm">
                        <Check size={14} /> {row[1]}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 text-gray-600 text-sm">
                        <X size={14} /> {row[2]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ─── XM BONUS ─────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-gray-800/60 bg-white/[0.02] p-10 md:p-14">
            {/* Glow subtil */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-[60px] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <Image src="/xm-logo.png" alt="XM" width={100} height={50} className="opacity-90" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Comece sem arriscar o seu dinheiro
                </h3>
                <p className="text-gray-500 text-sm">
                  A XM oferece $30 de bónus sem depósito. Crie uma conta e teste as análises do BOT24 com capital real — sem risco.
                </p>
              </div>
              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-white text-black px-7 py-3 rounded-xl font-bold hover:bg-gray-100 transition text-sm whitespace-nowrap"
              >
                Receber $30 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTEMUNHOS ──────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-semibold mb-5">
              Comunidade
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Traders angolanos já operam diferente
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { initials:"MA", name:"Manuel António",  text:"Comecei com o bónus da XM e o BOT24 já me ajudou a entender entradas muito melhores." },
              { initials:"CD", name:"Carlos Domingos", text:"Finalmente uma plataforma feita para quem fala português. As análises são claras e diretas." },
              { initials:"PM", name:"Paulo Mutota",    text:"Trabalhava à noite a ver gráficos sem parar. Agora o BOT24 faz isso por mim em segundos." },
              { initials:"JM", name:"José Miguel",     text:"A integração com a XM foi o que me convenceu. Já estou a testar as análises com capital real." },
              { initials:"AP", name:"António Pascoal", text:"Parece simples mas a tecnologia por trás é muito forte. Estou genuinamente impressionado." },
            ].map((c, i) => (
              <div key={i} className="bg-white/[0.02] border border-gray-800/50 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full text-xs font-bold text-gray-300">
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300">{c.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-yellow-500 text-[10px]">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">"{c.text}"</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-semibold mb-5">
              Dúvidas frequentes
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Tudo o que precisas de saber
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "O BOT24 é mesmo gratuito?",           a: "Sim. Todas as funções principais são gratuitas sem limite de tempo. Funcionalidades avançadas poderão ter um plano premium no futuro." },
              { q: "Preciso de experiência em Forex?",    a: "Não. O BOT24 foi desenhado para todos os níveis — o sinal inclui Entry, SL, TP e lote calculado. Basta seguir as instruções." },
              { q: "Como recebo as análises?",            a: "Todas as análises aparecem diretamente na plataforma, em tempo real, após configurares o teu timeframe e capital." },
              { q: "Os meus dados estão seguros?",        a: "Absolutamente. A plataforma usa Supabase com encriptação de ponta a ponta. Nunca partilhamos dados com terceiros." },
              { q: "Funciona para traders em Angola?",    a: "Foi construído especificamente para o contexto angolano — integração com a XM, suporte em português e gestão de risco adaptada." },
            ].map((faq, i) => (
              <div key={i} className="border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/60 hover:bg-white/[0.02] transition-all duration-200">
                <h3 className="font-semibold text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                {faq.q === "Preciso de experiência em Forex?" && (
                  <a
                    href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 bg-white text-black px-5 py-2 rounded-lg font-semibold text-xs hover:bg-gray-100 transition"
                  >
                    Elevar nível de trader →
                  </a>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            O mercado não espera.<br />
            <span className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              A tua análise já está pronta.
            </span>
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            Cria a tua conta gratuita e faz a tua primeira análise em menos de 60 segundos.
          </p>
          <a
            href="/auth/login"
            className="inline-block bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-gray-100 transition hover:scale-[1.02] shadow-[0_0_50px_rgba(255,255,255,0.1)] text-sm"
          >
            Começar gratuitamente
          </a>
        </div>
      </section>

    </main>
  );
}
