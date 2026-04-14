"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// ─── Ícone igual ao da imagem (duas barras grossas e desalinhadas) ───────────
function TwoLinesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Barra de cima */}
      <rect
        x="5"
        y="8"
        width="14"
        height="3"
        rx="2"
        fill="currentColor"
      />
      {/* Barra de baixo (ligeiramente mais abaixo que o centro perfeito) */}
      <rect
        x="5"
        y="14"
        width="14"
        height="3"
        rx="2"
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

  const lastScrollY  = useRef(0);
  const ticking      = useRef(false);

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
        ticking.current     = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-40
      bg-[#0b0b0c]/80 backdrop-blur-xl
      transition-transform duration-300 ease-in-out
      ${visible ? "translate-y-0" : "-translate-y-full"}
    `}>
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

        {/* Botão Menu estilo SaaS da imagem */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            flex items-center justify-center
            h-10 w-10
            rounded-full
            bg-white/10
            backdrop-blur-md
            text-white/80
            hover:text-white
            hover:bg-white/20
            transition-all duration-200
            active:scale-95
          "
          aria-label="Abrir menu"
        >
          <TwoLinesIcon size={18} />
        </button>

      </div>
    </nav>
  );
}
