"use client";

import Image from "next/image";
import { AlignLeft, LogOut, User, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Navbar({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0b0b0c]/70 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* LADO ESQUERDO */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
          >
            <AlignLeft size={24} strokeWidth={1.5} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/kt-icon.png"
              alt="KwanzaTrade"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="hidden md:block font-black text-white tracking-tighter text-lg italic">
              KWANZA<span className="text-blue-500">TRADE</span>
            </span>
          </Link>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/my-account"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition font-medium"
              >
                <User size={18} />
                <span className="hidden sm:inline">Conta</span>
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition font-medium"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-xl shadow-lg shadow-white/5 transition font-bold"
            >
              <LogIn size={18} />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
