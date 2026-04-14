"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Zap } from "lucide-react";

function TwoLinesIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="7.5" width="12" height="3.2" rx="1.6" fill="currentColor" />
      <rect x="4" y="14.5" width="12" height="3.2" rx="1.6" fill="currentColor" />
    </svg>
  );
}

export default function Navbar({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);

  const [analysesUsed, setAnalysesUsed] = useState<number>(0);
  const [capital, setCapital] = useState<number | null>(null);

  const DAILY_LIMIT = 10;

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // ── Scroll ─────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        setAtTop(currentY < 10);

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

  // ── Buscar dados CORRETAMENTE ───────────────────────
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Capital
      const { data: profile } = await supabase
        .from("trading_profiles")
        .select("capital")
        .eq("user_id", user.id)
        .single();

      if (profile?.capital) setCapital(profile.capital);

      // ✅ CORRETO: usar RPC
      const { data: countData } = await supabase.rpc(
        "get_daily_analysis_count",
        { user_uuid: user.id }
      );

      setAnalysesUsed(countData || 0);
    };

    fetchUserData();

    // Atualização em tempo real
    const channel = supabase
      .channel("navbar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analysis_usage" },
        fetchUserData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const analysesLeft = Math.max(0, DAILY_LIMIT - analysesUsed);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-40
        transition-all duration-300 ease-in-out
        ${visible ? "translate-y-0" : "-translate-y-full"}
        ${atTop
          ? "bg-transparent"
          : "bg-[#0b0b0c]/80 backdrop-blur-xl"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard">
          <Image
            src="/kt-icon.png"
            alt="Logo"
            width={36}
            height={36}
            className="rounded-xl"
          />
        </Link>

        {/* Direita */}
        <div className="flex items-center gap-4">

          {/* Capital */}
          {capital !== null && (
            <span className="text-white text-sm font-semibold tabular-nums">
              ${capital.toLocaleString("en-US")}
            </span>
          )}

          {/* Análises restantes */}
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-lg px-2.5 py-1">
            <Zap size={13} className="text-emerald-400 fill-emerald-400" />
            <span className="text-white text-xs font-bold tabular-nums">
              {analysesLeft}
            </span>
          </div>

          {/* Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              flex items-center justify-center p-2
              text-white/90 hover:text-white
              transition-colors
            "
          >
            <TwoLinesIcon size={28} />
          </button>

        </div>
      </div>
    </nav>
  );
}
