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
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Buscar usuário
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // Listener auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4">
      <nav
        className={`mx-auto max-w-5xl transition-all duration-500 ${
          scrolled ? "bg-[#0b0b0c]/70" : "bg-[#0b0b0c]/40"
        } backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-4 py-2 flex items-center justify-between`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition active:scale-90"
          >
            <AlignLeft size={20} strokeWidth={1.5} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/kt-icon.png"
              alt="KwanzaTrade"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold text-white/80 hidden sm:block">
              KwanzaTrade
            </span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/my-account"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
              >
                <User size={16} />
                <span className="text-xs hidden sm:block">
                  {user.email?.split("@")[0] ?? "Conta"}
                </span>
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold text-xs hover:scale-105 transition"
            >
              <LogIn size={16} />
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
