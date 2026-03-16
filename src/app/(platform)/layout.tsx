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
        // ✅ stopLoading sempre chamado, mesmo em erro
        if (!cancelled) stopLoading();
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  return (
    <div className="flex bg-[#0d0d0d] text-white min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
