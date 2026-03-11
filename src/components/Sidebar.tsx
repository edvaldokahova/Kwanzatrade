"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Bot,
  History,
  User,
  ExternalLink,
  Download,
  LogOut
} from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    }

    fetchUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      {/* OVERLAY */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-[#0b0b0c] border-r border-gray-800 p-6 flex flex-col z-[60] transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* LOGO */}
        <div className="flex justify-center mb-10">
          <Image
            src="/bot24_an.svg"
            alt="KwanzaTrade"
            width={50}
            height={50}
            className="h-12 w-auto"
          />
        </div>

        <nav className="flex flex-col gap-2 flex-1 text-sm">

          {user ? (
            <>
              <Link
                href="/my-account"
                className={`menu ${isActive("/my-account") ? "active" : ""}`}
              >
                <User size={18} /> Minha Conta
              </Link>

              <Link
                href="/dashboard"
                className={`menu ${isActive("/dashboard") ? "active" : ""}`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              <Link
                href="/bot24"
                className={`menu ${isActive("/bot24") ? "active" : ""}`}
              >
                <Bot size={18} /> BOT24
              </Link>

              <Link
                href="/live-signals"
                className={`menu ${isActive("/live-signals") ? "active" : ""}`}
              >
                <Bot size={18} /> Live Signals
              </Link>

              <Link
                href="/performance"
                className={`menu ${isActive("/performance") ? "active" : ""}`}
              >
                <LayoutDashboard size={18} /> Performance
              </Link>

              <Link
                href="/history"
                className={`menu ${isActive("/history") ? "active" : ""}`}
              >
                <History size={18} /> Histórico
              </Link>

              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5781"
                target="_blank"
                className="menu"
              >
                <ExternalLink size={18} /> Operar na XM
              </a>

              <a
                href="https://drive.google.com/uc?export=download&id=1jTZx36bg8y3cvwYCjRff3yiSv6yYr3Nw"
                className="menu"
              >
                <Download size={18} /> Manual Download
              </a>

              <button
                onClick={logout}
                className="menu text-red-400 hover:text-red-500"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              {/* CORREÇÃO: Adicionado 'block' para o elemento respeitar o layout */}
              <Link
                href="/page/auth"
                className="xm-button block mt-4 text-white font-semibold text-center py-3 rounded-xl transition"
              >
                Operar na XM
              </Link>

              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
                target="_blank"
                className="menu mt-4"
              >
                <ExternalLink size={18} /> Bônus $30 XM
              </a>

              <Link href="/about" className="menu">
                Sobre
              </Link>
            </>
          )}
        </nav>

        {/* CORREÇÃO: Adicionado o atributo 'global' para garantir aplicação da classe */}
        <style jsx global>{`

          /* BOTÃO VERMELHO XM */
          .xm-button{
            background: #ff0000 !important;
            box-shadow:
              0 0 10px rgba(255,0,0,0.6),
              0 0 20px rgba(255,0,0,0.4),
              0 0 40px rgba(255,0,0,0.2);
            animation: xmGlow 2.5s ease-in-out infinite;
          }

          .xm-button:hover{
            box-shadow:
              0 0 15px rgba(255,0,0,0.9),
              0 0 30px rgba(255,0,0,0.6),
              0 0 60px rgba(255,0,0,0.4);
            transform: scale(1.02);
          }

          @keyframes xmGlow{
            0%{
              box-shadow:
                0 0 8px rgba(255,0,0,0.6),
                0 0 18px rgba(255,0,0,0.3);
            }
            50%{
              box-shadow:
                0 0 20px rgba(255,0,0,0.9),
                0 0 40px rgba(255,0,0,0.6);
            }
            100%{
              box-shadow:
                0 0 8px rgba(255,0,0,0.6),
                0 0 18px rgba(255,0,0,0.3);
            }
          }
        `}</style>

      </div>
    </>
  );
}