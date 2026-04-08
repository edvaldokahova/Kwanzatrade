"use client";

import Image from "next/image";
import { Facebook, Instagram, Youtube, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-16 px-6 bg-[#0b0b0c]">
      <div className="max-w-6xl mx-auto">

        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 pb-10 border-b border-gray-800/40">

          {/* Brand */}
          <div>
            <Image
              src="/kwanzatrade-logo.svg"
              alt="KwanzaTrade"
              width={130}
              height={26}
              className="opacity-80 mb-3"
            />
            <p className="text-gray-600 text-xs max-w-xs leading-relaxed">
              Inteligência de mercado para traders angolanos.<br />
              Powered by Gemini 2.5 Flash.
            </p>
          </div>

          {/* Links + Sociais */}
          <div className="flex flex-col items-start md:items-end gap-5">
            <div className="flex gap-6 text-xs text-gray-600 font-medium">
              <a href="/terms"   className="hover:text-gray-300 transition">Termos</a>
              <a href="/privacy" className="hover:text-gray-300 transition">Privacidade</a>
              <a href="/about"   className="hover:text-gray-300 transition">Sobre</a>
            </div>
            <div className="flex gap-4">
              {[
                { href: "https://www.facebook.com/share/17ign3zqzv/",           icon: Facebook      },
                { href: "https://www.instagram.com/edvaldoeduardo_official",    icon: Instagram     },
                { href: "https://youtube.com/@edvaldo_trade",                   icon: Youtube       },
                { href: "https://wa.me/244955968159",                           icon: MessageSquare },
              ].map(({ href, icon: Icon }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800/60 text-gray-600 hover:text-white hover:border-gray-600 transition"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} KwanzaTrade. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-700">
            Trading implica risco. Opere com responsabilidade.
          </p>
        </div>

      </div>
    </footer>
  );
}
