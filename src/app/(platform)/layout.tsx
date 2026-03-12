"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Criamos o estado para controlar se a barra está aberta ou não
  const [open, setOpen] = useState(false);

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      {/* CORREÇÃO: O componente Sidebar espera 'onClose' e não 'setOpen'.
        Passamos uma função que define 'open' como falso quando chamada.
      */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}
