"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// ─── Ícone Fiel à Imagem (Barras grossas, arredondadas e desalinhadas) ───────
function TwoLinesIcon({ size = 22 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Barra de cima: mais curta e posicionada à esquerda */}
      <rect
        x="4"
        y="9"
        width="9"
        height="2.8"
        rx="1.4"
        fill="currentColor"
      />
      {/* Barra de baixo: mais longa e deslocada para a direita */}
      <rect
        x="7"
        y="13.5"
        width="13"
        height="2.8"
        rx="1.4"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Navbar({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // ── Scroll — esconde ao descer, aparece ao subir ──────────────────────────
  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY < 10) {
          setVisible(true);
        } else if (currentY > lastScrollY.current) {
          setVisible(false);
        } else {
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-40
        bg-[#0b0b0c]/80 backdrop-blur-xl
        transition-transform duration-300 ease-in-out
        border-none outline-none
        ${visible ? "translate-y-0" : "-translate-y-full"}
      `}
      style={{ borderBottom: 'none' }} // Garantia extra contra linhas residuais
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/kt-icon.png"
            alt="KwanzaTrade"
            width={34}
            height={34}
            className="rounded-lg"
          />
        </Link>

        {/* Botão Menu conforme a imagem enviada */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            flex items-center justify-center
            h-11 w-11
            rounded-full
            bg-white/10
            text-white/90
            hover:text-white
            hover:bg-white/15
            transition-all duration-200
            active:scale-90
          "
          aria-label="Abrir menu"
        >
          <TwoLinesIcon size={22} />
        </button>

      </div>
    </nav>
  );
}
