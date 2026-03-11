"use client";

import Image from "next/image";
import { Facebook, Instagram, Youtube, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800 py-13 px-5">

      {/* background */}
      <Image
        src="/footer.png"
        alt="footer background"
        fill
        className="object-cover opacity-20"
      />

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-400">

        {/* copyright + logo */}
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()}</span>

          <Image
            src="/kwanzatrade-logo.svg"
            alt="KwanzaTrade"
            width={119}
            height={25}
            className="h-4.5 w-auto"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-6 md:mt-0 items-center">

          <div className="flex gap-6">
            <a href="/terms" className="hover:text-white">Termos</a>
            <a href="/privacy" className="hover:text-white">Privacidade</a>
            <a href="/about" className="hover:text-white">Sobre</a>
          </div>

          <div className="flex gap-5 mt-4 md:mt-0">

            <a
              href="https://www.facebook.com/share/17ign3zqzv/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Facebook size={22} />
            </a>

            <a
              href="https://www.instagram.com/edvaldoeduardo_official"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Instagram size={22} />
            </a>

            <a
              href="https://youtube.com/@edvaldo_trade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Youtube size={22} />
            </a>

            <a
              href="https://wa.me/244955968159"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <MessageSquare size={22} />
            </a>

          </div>

        </div>

      </div>
    </footer>
  );
}