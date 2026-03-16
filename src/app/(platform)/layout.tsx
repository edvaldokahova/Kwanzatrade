"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client"; // ✅ instância pronta
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

  useEffect(() => {
    const checkSession = async () => {
      startLoading();

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/auth/login");
      } else {
        setReady(true);
      }

      stopLoading();
    };

    checkSession();
  }, [router, startLoading, stopLoading]);

  if (!ready) return null;

  return (
    <div className="flex bg-[#0d0d0d] text-white min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
