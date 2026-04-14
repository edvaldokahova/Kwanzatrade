"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// ─── Animação CSS para o botão (Pulsação) ─────────────────────────────────
const animationStyles = `
  @keyframes icon-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  .icon-pulse-animation {
    animation: icon-pulse 0.4s ease-out;
  }
`;

// ─── Ícone de Duas Linhas (Alinhamento Simétrico e Arredondado) ──────────────
// Baseado na imagem original de referência, mas com linhas de mesma largura e centralizadas.
function TwoLinesIcon({ size = 26 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Barra de cima - Mesma largura, centralizada */}
      <rect
        x="5"
        y="9"
        width="14"
        height="2.8"
        rx="1.4"
        fill="currentColor"
      />
      {/* Barra de baixo - Mesma largura, centralizada */}
      <rect
        x="5"
        y="13.5"
        width="14"
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
  const [pulse, setPulse] = useState(false);
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

  // ── Função de Clique com Animação ─────────────────────────────────────────
  const handleMenuClick = () => {
    // Iniciar animação
    setPulse(true);
    // Abrir a sidebar
    setSidebarOpen(true); 
    // Resetar o estado de animação após o término (0.4s)
    setTimeout(() => setPulse(false), 400); 
  };

  return (
    <>
      <style>{animationStyles}</style>
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

          {/* Botão Menu modificado - Sem fundo, maior, com animação */}
          <button
            onClick={handleMenuClick}
            className={`
              flex items-center justify-center
              h-12 w-12
              rounded-full
              text-white/90
              hover:text-white
              transition-all duration-200
              active:scale-95
              ${pulse ? "icon-pulse-animation" : ""}
            `}
            aria-label="Abrir menu"
          >
            <TwoLinesIcon size={26} />
          </button>

        </div>
      </nav>
    </>
  );
}
