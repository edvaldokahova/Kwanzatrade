"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useLoader } from "@/context/LoaderContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const { startLoading, stopLoading } = useLoader();

  useEffect(() => {
    const checkSession = async () => {
      startLoading();

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/auth/login");
      } else {
        setReady(true);
      }

      stopLoading();
    };

    checkSession();
  }, [router, startLoading, stopLoading]);

  // evita render antes da verificação
  if (!ready) return null;

  return (
    <div className="flex bg-[#0b0b0c] text-white min-h-screen">
      
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 flex flex-col">
        
        <Navbar />

        <main className="flex-1 p-10 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
