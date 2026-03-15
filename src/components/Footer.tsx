"use client";

import Image from "next/image";
import { Facebook, Instagram, Youtube, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800 py-13 px-5 bg-[#0b0b0c] overflow-hidden">

      {/* background image apenas no mobile - ajustada para não haver cortes */}
      <div className="md:hidden absolute inset-0 pointer-events-none">
        <Image
          src="/footer.png"
          alt="footer background"
          fill
          className="object-contain opacity-20"
          priority={false}
        />
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-400 z-10">

        {/* copyright + logo */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">© {new Date().getFullYear()}</span>

          <Image
            src="/kwanzatrade-logo.svg"
            alt="KwanzaTrade"
            width={119}
            height={25}
            className="h-4.5 w-auto"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-6 md:mt-0 items-center">

          <div className="flex gap-6 text-sm font-semibold">
            <a href="/terms" className="hover:text-white transition-colors">Termos</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacidade</a>
            <a href="/about" className="hover:text-white transition-colors">Sobre</a>
          </div>

          <div className="flex gap-5 mt-4 md:mt-0">

            <a
              href="https://www.facebook.com/share/17ign3zqzv/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-all hover:scale-110"
            >
              <Facebook size={22} />
            </a>

            <a
              href="https://www.instagram.com/edvaldoeduardo_official"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-all hover:scale-110"
            >
              <Instagram size={22} />
            </a>

            <a
              href="https://youtube.com/@edvaldo_trade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-all hover:scale-110"
            >
              <Youtube size={22} />
            </a>

            <a
              href="https://wa.me/244955968159"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-all hover:scale-110"
            >
              <MessageSquare size={22} />
            </a>

          </div>

        </div>

      </div>
    </footer>
  );
}
