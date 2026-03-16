"use client";

import Image from "next/image";
import { AlignLeft, LogOut, User, LogIn } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function Navbar({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Busca inicial
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // ✅ Listener de estado — ref estável, sem loop
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0b0b0c]/80 backdrop-blur-xl border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Esquerda */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
            aria-label="Abrir menu"
          >
            <AlignLeft size={22} strokeWidth={1.5} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/kt-icon.png"
              alt="KwanzaTrade"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </Link>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/my-account"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <User size={17} />
                <span className="hidden sm:inline text-xs font-semibold">
                  {user.email?.split("@")[0] ?? "Conta"}
                </span>
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/5"
              >
                <LogOut size={17} />
                <span className="hidden sm:inline text-xs">Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-xl shadow-lg shadow-white/5 transition font-bold text-xs"
            >
              <LogIn size={16} />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
