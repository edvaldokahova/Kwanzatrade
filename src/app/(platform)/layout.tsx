"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      {/* Agora sincronizado: 'open' controla a visibilidade e 'onClose' reseta o estado */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
