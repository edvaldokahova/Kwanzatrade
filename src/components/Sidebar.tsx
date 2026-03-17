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
  X,
  Activity,
} from "lucide-react";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
  { href: "/my-account", label: "Minha Conta", icon: User },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bot24/analyze", label: "BOT24 AI", icon: Bot },
  { href: "/live-signals", label: "Live Signals", icon: Radio },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/bot24/heatmap", label: "Heatmap", icon: Activity },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // ✅ Instância estável
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

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

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-[#0b0b0c] border-r border-gray-800/80 p-6 flex flex-col z-[60] transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/kt-icon.png"
            alt="KwanzaTrade"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {user ? (
            <>
              {/* Email do utilizador */}
              <div className="px-3 py-2 mb-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  Conta
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              {/* Links principais */}
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`menu ${isActive(href) ? "active" : ""}`}
                >
                  <Icon size={17} />
                  <span className="text-sm">{label}</span>
                </Link>
              ))}

              {/* Divisor */}
              <div className="h-px bg-gray-800/80 my-3" />

              {/* Links externos */}
              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=5"
                target="_blank"
                rel="noopener noreferrer"
                className="menu"
              >
                <ExternalLink size={17} />
                <span className="text-sm">Operar na XM</span>
              </a>

              <a
                href="https://drive.google.com/uc?export=download&id=1jTZx36bg8y3cvwYCjRff3yiSv6yYr3Nw"
                target="_blank"
                rel="noopener noreferrer"
                className="menu"
              >
                <Download size={17} />
                <span className="text-sm">Manual Download</span>
              </a>

              {/* Logout — empurrado para o fundo */}
              <div className="mt-auto pt-3">
                <button
                  onClick={logout}
                  className="menu text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
                >
                  <LogOut size={17} />
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={onClose} className="menu">
                <span className="text-sm">Entrar</span>
              </Link>
              <Link href="/auth/register" onClick={onClose} className="menu">
                <span className="text-sm">Criar conta</span>
              </Link>
              <a
                href="https://clicks.pipaffiliates.com/c?c=1182135&l=en&p=6"
                target="_blank"
                rel="noopener noreferrer"
                className="menu mt-2"
              >
                <ExternalLink size={17} />
                <span className="text-sm">Bônus $30 XM</span>
              </a>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
