"use client";

import Image from "next/image";
import { Check, X, ArrowRight, MessageCircle, LogIn, User, Brain, Zap, BarChart2, Shield, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showNavbar, setShowNavbar] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#0b0b0c]/80 backdrop-blur-xl border-b border-gray-800 transition-all duration-500 transform ${
        showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/kt-icon.png" alt="Bot24" width={38} height={38} className="rounded-lg" />
          </div>
          <div className="flex items-center">
            {user ? (
              <a href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                <User size={18} /> Cockpit
              </a>
            ) : (
              <a href="/auth/login" className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-xl shadow-lg transition font-semibold text-sm">
                <LogIn size={18} /> Entrar
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <video src="/fundo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Image src="/kwanzatrade-logo.svg" alt="Kwanzatrade" width={200} height={40} className="mb-10" />
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              O mercado{" "}
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">Forex</span>{" "}
              nunca dorme.
              <br />
              A maioria dos{" "}
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">Traders</span>{" "}
              também não
            </h1>
            <p className="mt-6 text-gray-400 text-lg">
              Milionário? Lucre no Forex em Angola com o poder da Inteligência Artificial.
              Receba análises precisas e insights personalizados em tempo Real.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="/auth/login" className="bg-white text-black px-6 py-3 rounded-lg font-medium transition hover:scale-105 hover:shadow-xl inline-block text-center">
                Começar gratuitamente
              </a>
              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-gray-700 px-6 py-3 rounded-lg hover:bg-[#141416] transition animate-pulse shadow-[0_0_20px_rgba(200,200,200,0.08)] hover:shadow-[0_0_35px_rgba(200,200,200,0.18)]"
              >
                Ganhar $30 <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SOBRE — SECÇÃO KWANZATRADE? REDESENHADA */}
      <section className="border-t border-gray-800 py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Titulo */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                KWANZATRADE?
              </span>
            </h1>
            <p className="mt-6 text-gray-400 text-lg max-w-3xl mx-auto">
              A primeira plataforma de inteligência de mercado feita para traders angolanos.
              Combinamos dados reais de mercado com os frameworks dos maiores traders da história
              — tudo processado pelo <strong className="text-white">Gemini 2.5 Flash</strong> da Google.
            </p>
          </div>

          {/* Como funciona — pipeline visual */}
          <div className="mb-20">
            <p className="text-center text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-8">
              Como a magia acontece
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
              {[
                { label: "Dados Reais",    desc: "Alpha Vantage + Marketaux + Frankfurter", color: "border-blue-500/30 bg-blue-500/5" },
                { label: "→",             desc: "",                                          color: "border-transparent bg-transparent text-gray-600 text-2xl" },
                { label: "Soros + Wynn",  desc: "Framework de traders lendários",           color: "border-purple-500/30 bg-purple-500/5" },
                { label: "→",             desc: "",                                          color: "border-transparent bg-transparent text-gray-600 text-2xl" },
                { label: "Gemini 2.5",    desc: "Uma das mais avançadas do Google",               color: "border-[#00FFB2]/30 bg-[#00FFB2]/5" },
                { label: "→",             desc: "",                                          color: "border-transparent bg-transparent text-gray-600 text-2xl" },
                { label: "Tua Análise",   desc: "Entry · SL · TP · Lote em 2 segundos",    color: "border-green-500/30 bg-green-500/5" },
              ].map((step, i) => (
                step.desc === "" ? (
                  <div key={i} className="hidden md:flex text-gray-600 text-2xl font-bold">{step.label}</div>
                ) : (
                  <div key={i} className={`flex-1 text-center p-4 rounded-xl border ${step.color}`}>
                    <p className="text-white font-bold text-sm mb-1">{step.label}</p>
                    <p className="text-gray-500 text-[10px]">{step.desc}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Dois bots — cards lado a lado */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">

            {/* Bot24 */}
            <div className="relative bg-[#111113] border border-gray-800 rounded-2xl p-8 overflow-hidden hover:border-blue-400/40 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="flex items-center gap-4 mb-6">
                <Image src="/bot24_an.svg" alt="Bot24" width={48} height={48} />
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">BOT24</h3>
                  <p className="text-[11px] text-blue-400/40 font-bold uppercase tracking-widest">EUR/USD Forex</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Analisa o par mais líquido do mundo usando o framework de <strong className="text-white">George Soros</strong> —
                reflexividade de mercado, caça a liquidez e gestão de risco assimétrica.
                Recebes Entry, Stop Loss, Take Profit e lote calculado em menos de 2 segundos.
              </p>
              <div className="space-y-2">
                {[
                  "Framework George Soros — Reflexividade",
                  "Dados reais Alpha Vantage + notícias MarketAux",
                  "Alerta Conta Micro para capitais baixos",
                  "Timer de validade da análise por timeframe",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-gray-400">
                    <Check size={13} className="text-blue-400/40 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

          {/* 4 pilares */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Brain,      color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", label: "IA Institucional",  desc: "Gemini 2.5 Flash treinado com décadas de conhecimento de trading" },
              { icon: BarChart2,  color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20",   label: "Dados Reais",        desc: "Alpha Vantage, CoinGecko, MarketAux, Frankfurter/BCE" },
              { icon: Shield,     color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20", label: "Risco Controlado",   desc: "SL obrigatório, lote calculado, alerta de liquidação" },
              { icon: Clock,      color: "text-[#F7931A]",  bg: "bg-[#F7931A]/10 border-[#F7931A]/20", label: "2 Segundos",         desc: "Da análise ao sinal completo — mais rápido que qualquer humano" },
            ].map(({ icon: Icon, color, bg, label, desc }, i) => (
              <div key={i} className={`p-5 rounded-xl border ${bg} text-center`}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className={`text-sm font-black ${color} mb-1`}>{label}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* BOT24 */}
      <section className="border-t border-gray-800 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mx-auto mb-16 relative max-w-[500px] w-full rounded-2xl overflow-hidden border border-gray-800 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
            <video src="/signail.mp4" autoPlay loop muted playsInline className="w-full h-auto opacity-90" />
          </div>
          <div className="flex justify-center my-12">
            <Image src="/bot.png" alt="Bot" width={190} height={190} className="opacity-90" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight text-center">
            <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-500 bg-clip-text text-transparent">BOT24</span>
          </h1>
          <p className="text-gray-400 mt-4">
            O cérebro por trás das análises. O BOT24 observa o mercado continuamente
            e organiza informação relevante para traders operarem com mais segurança e lucro.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {["Análise Constante do Mercado", "Contexto Baseado em Dados", "Menos Tempo de Análise"].map((text, i) => (
              <div key={i} className="bg-[#111113] p-8 rounded-xl border border-gray-800 hover:border-blue-400/40 transition-all duration-300 hover:-translate-y-2 shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.25)]">
                <p className="text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="border-t border-gray-800 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <Image src="/trophy.webp" alt="Comparação" width={124} height={124} className="opacity-80" />
          </div>
          <h2 className="text-3xl font-semibold text-center">Comparação</h2>
          <div className="mt-12 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111113]">
                <tr>
                  <th className="p-3"></th>
                  <th className="p-3 text-green-400 text-center">KwanzaTrade</th>
                  <th className="p-3 text-gray-400 text-center">Outras</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {[
                  ["Preço",      "Gratuito",    "+14$/mês"],
                  ["Velocidade", "Instantânea", "Moderada"],
                  ["Sinais",     "Estruturados","Técnicos"],
                  ["Condição",   "Nenhuma",     "Experiente"],
                  ["Tempo",      "Minutos",     "Horas"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="p-3">{row[0]}</td>
                    <td className="p-3 text-green-400 text-center">
                      <span className="inline-flex items-center gap-2"><Check size={16} /> {row[1]}</span>
                    </td>
                    <td className="p-3 text-red-400 text-center">
                      <span className="inline-flex items-center gap-2"><X size={16} /> {row[2]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* XM BONUS */}
      <section className="border-t border-gray-800 py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#111113] border border-gray-800 rounded-2xl p-10 text-center hover:border-gray-600 transition">
          <Image src="/xm-logo.png" alt="XM" width={120} height={60} className="mx-auto mb-6" />
          <h3 className="text-2xl font-semibold">$30 para começar no Forex</h3>
          <p className="text-gray-400 mt-4">Sem Kumbo? A XM oferece um bónus de $30 sem necessidade de depósito.</p>
          <a
            href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-white text-black px-6 py-3 rounded-lg font-medium hover:scale-105 transition"
          >
            Criar conta e receber $30
          </a>
        </div>
      </section>

      {/* COMENTÁRIOS */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-semibold text-center mb-16">Traders Angola</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { initials:"MA", name:"Manuel António",  text:"Comecei com o bônus da XM e o Bot24 já me ajudou a entender entradas melhores." },
            { initials:"CD", name:"Carlos Domingos", text:"Finalmente uma plataforma feita para quem fala português. As análises são claras." },
            { initials:"PM", name:"Paulo Mutota",    text:"Eu trabalhava à noite a ver gráficos incansavelmente. Agora o Bot24 faz isso por mim." },
            { initials:"JM", name:"José Miguel",     text:"A integração com a XM foi o que me convenceu. Já estou a testar as análises." },
            { initials:"AP", name:"António Pascoal", text:"Parece simples mas a tecnologia por trás é muito forte. Estou impressionado." },
          ].map((c, i) => (
            <div key={i} className="bg-[#111113] border border-gray-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#1c1c1f] rounded-full text-sm font-semibold">
                  {c.initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <MessageCircle size={14} className="text-green-500" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-semibold text-center mb-16">Perguntas Frequentes</h2>
        <div className="space-y-6">
          {[
            { q:"O Bot24 é realmente grátis?",            a:"Sim! Você pode usar todas as funções básicas sem pagar. Apenas se quiser funcionalidades avançadas." },
            { q:"Preciso ter experiência em Forex?",      a:"Não! O Bot24 foi feito para todos, desde iniciantes até traders experientes." },
            { q:"Como recebo análises e sinais?",         a:"Todas as análises são disponibilizadas na plataforma em tempo real." },
            { q:"É seguro usar a plataforma?",            a:"Absolutamente! Todos os dados são protegidos." },
            { q:"Posso usar em Angola?",                  a:"Sim! A plataforma foi pensada para o público angolano." },
          ].map((faq, i) => (
            <div key={i} className="bg-[#111113] border border-gray-800 p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-2">{faq.q}</h3>
              <p className="text-gray-400 text-sm">{faq.a}</p>
              {faq.q === "Preciso ter experiência em Forex?" && (
                <a
                  href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-white text-black px-6 py-2 rounded-lg font-medium hover:scale-105 transition"
                >
                  Elevar nível de trader
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
