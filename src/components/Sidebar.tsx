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
  LogOut,
  TrendingUp,
  Radio,
  X 
} from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  const supabase = createClient(); // 🔹 instância atualizada

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
  }, [supabase]);

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
        {/* BOTÃO FECHAR (X) */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* LOGOTIPO */}
        <div className="flex justify-center mb-10">
          <Image
            src="/kt-icon.png"
            alt="kwanzaTrade"
            width={50}
            height={50}
            className="h-12 w-auto"
          />
        </div>

        <nav className="flex flex-col gap-2 flex-1 text-sm overflow-y-auto">
          {user ? (
            <>
              <Link
                href="/my-account"
                onClick={onClose}
                className={`menu ${isActive("/my-account") ? "active" : ""}`}
              >
                <User size={18} /> Minha Conta
              </Link>

              <Link
                href="/dashboard"
                onClick={onClose}
                className={`menu ${isActive("/dashboard") ? "active" : ""}`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              <Link
                href="/bot24/analyze"
                onClick={onClose}
                className={`menu ${isActive("/bot24/analyze") ? "active" : ""}`}
              >
                <Bot size={18} /> BOT24 AI
              </Link>

              <Link
                href="/live-signals"
                onClick={onClose}
                className={`menu ${isActive("/live-signals") ? "active" : ""}`}
              >
                <Radio size={18} /> Live Signals
              </Link>

              <Link
                href="/performance"
                onClick={onClose}
                className={`menu ${isActive("/performance") ? "active" : ""}`}
              >
                <TrendingUp size={18} /> Performance
              </Link>

              <Link
                href="/bot24/history"
                onClick={onClose}
                className={`menu ${isActive("/bot24/history") ? "active" : ""}`}
              >
                <History size={18} /> Histórico
              </Link>

              <div className="h-px bg-gray-800 my-4" />

              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5"
                target="_blank"
                rel="noopener noreferrer"
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
                className="menu text-red-400 hover:text-red-500 mt-auto"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
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

        <style jsx global>{`
          .menu {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 12px;
            color: #94a3b8;
            transition: all 0.2s;
            border: 1px solid transparent;
          }

          .menu:hover {
            background: rgba(255, 255, 255, 0.05);
            color: white;
          }

          .menu.active {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
            font-weight: 700;
            border: 1px solid rgba(59, 130, 246, 0.3);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.25);
          }

          .xm-button {
            background: #ff0000 !important;
            transition: background 0.2s ease;
          }

          .xm-button:hover {
            background: #cc0000 !important;
          }
        `}</style>
      </div>
    </>
  );
    
}
