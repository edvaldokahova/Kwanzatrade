"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Criamos o estado que o Sidebar exige para saber se está aberto ou fechado
  const [open, setOpen] = useState(false);

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      {/* Passamos as propriedades 'open' e 'setOpen' que estavam em falta */}
      <Sidebar open={open} setOpen={setOpen} />

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}
