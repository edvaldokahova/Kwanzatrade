"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// ─── Animação de clique (Feedback Snappy) ──────────────────────────────────
const animationStyles = `
  @keyframes icon-click {
    0% { transform: scale(1); }
    50% { transform: scale(0.85); opacity: 0.7; }
    100% { transform: scale(1); }
  }
  .click-animation {
    animation: icon-click 0.3s ease-out;
  }
`;

// ─── Ícone de Duas Linhas Descentralizadas (SaaS Style) ─────────────────────
function TwoLinesIcon({ size = 28 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Barra de cima - Deslocada para a DIREITA */}
      <rect
        x="8"
        y="7.5"
        width="12"
        height="3.2"
        rx="1.6"
        fill="currentColor"
      />
      {/* Barra de baixo - Deslocada para a ESQUERDA (Mesmo tamanho) */}
      <rect
        x="4"
        y="14.5"
        width="12"
        height="3.2"
        rx="1.6"
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
  const [isAnimating, setIsAnimating] = useState(false);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // ── Controle de visibilidade no Scroll ────────────────────────────────────
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

  const handleMenuClick = () => {
    setIsAnimating(true);
    setSidebarOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <>
      <style>{animationStyles}</style>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-40
          bg-[#0b0b0c]/80 backdrop-blur-xl
          transition-transform duration-300 ease-in-out
          border-none
          ${visible ? "translate-y-0" : "-translate-y-full"}
        `}
        style={{ borderBottom: 'none', boxShadow: 'none' }}
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/kt-icon.png"
              alt="Logo"
              width={36}
              height={36}
              className="rounded-xl"
            />
          </Link>

          {/* Botão Menu - Sem fundo, maior e com a lógica de distância correta */}
          <button
            onClick={handleMenuClick}
            className={`
              flex items-center justify-center
              p-2
              text-white/90
              hover:text-white
              transition-colors
              outline-none
              ${isAnimating ? "click-animation" : ""}
            `}
            aria-label="Abrir menu"
          >
            <TwoLinesIcon size={28} />
          </button>

        </div>
      </nav>
    </>
  );
}
