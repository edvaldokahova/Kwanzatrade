"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useLoader } from "@/context/LoaderContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const { startLoading, stopLoading } = useLoader();

  // ✅ Instância estável — não recria a cada render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      startLoading();
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error || !data.session) {
          router.replace("/auth/login");
        } else {
          setReady(true);
        }
      } catch {
        if (!cancelled) router.replace("/auth/login");
      } finally {
        // ✅ Sempre executado, mesmo em caso de erro
        if (!cancelled) stopLoading();
      }
    };

    checkSession();

    // ✅ Listener de mudança de sessão — logout automático se sessão expirar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        if (!session) {
          router.replace("/auth/login");
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enquanto a sessão não é confirmada, não renderiza nada
  if (!ready) return null;

  return (
    <div className="flex bg-[#0d0d0d] text-white min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar setSidebarOpen={setSidebarOpen} />
        {/* ✅ pt-16 para compensar a Navbar fixed */}
        <main className="flex-1 pt-16 px-0 md:px-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
