"use client";

import Image from "next/image";
import { LogOut, User, LogIn } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// ─── Ícone duas barras iguais (igual ao da imagem) ────────────────────────────
function TwoLinesIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="9"  x2="20" y2="9"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [user,    setUser]    = useState<any>(null);
  const [visible, setVisible] = useState(true);

  const lastScrollY  = useRef(0);
  const ticking      = useRef(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── Scroll — esconde ao descer, aparece ao subir ──────────────────────────
  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY < 10) {
          // Topo da página — sempre visível
          setVisible(true);
        } else if (currentY > lastScrollY.current) {
          // A descer → esconde
          setVisible(false);
        } else {
          // A subir → mostra
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current     = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-40
      bg-[#0b0b0c]/80 backdrop-blur-xl
      border-b border-gray-800/80
      transition-transform duration-300 ease-in-out
      ${visible ? "translate-y-0" : "-translate-y-full"}
    `}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Esquerda — logotipo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/kt-icon.png"
            alt="KwanzaTrade"
            width={34}
            height={34}
            className="rounded-lg"
          />
        </Link>

        {/* Direita — user + menu */}
        <div className="flex items-center gap-2">

          {/* Info do utilizador (compacto) */}
          {user ? (
            <div className="flex items-center gap-1">
              <Link
                href="/my-account"
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition px-2 py-1.5 rounded-lg hover:bg-white/5"
              >
                <User size={15} />
                <span className="hidden sm:inline text-[11px] font-semibold">
                  {user.email?.split("@")[0] ?? "Conta"}
                </span>
              </Link>

              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/5"
                aria-label="Sair"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-xl shadow-lg transition font-bold text-xs mr-1"
            >
              <LogIn size={15} />
              Entrar
            </Link>
          )}

          {/* Botão menu — duas barras iguais */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all active:scale-95"
            aria-label="Abrir menu"
          >
            <TwoLinesIcon size={22} />
          </button>

        </div>
      </div>
    </nav>
  );
}
