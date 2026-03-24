"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

// ✅ AppLayout NÃO renderiza Navbar/Sidebar — isso é responsabilidade do PlatformLayout.
// AppLayout serve apenas como wrapper global (Footer para páginas públicas).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Plataforma tem o próprio layout com Navbar+Sidebar
  const isPlatform =
    pathname?.startsWith("/dashboard")    ||
    pathname?.startsWith("/bot24")        ||
    pathname?.startsWith("/live-signals") ||
    pathname?.startsWith("/performance")  ||
    pathname?.startsWith("/my-account");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
      {/* Footer apenas fora da plataforma (landing, auth) */}
      {!isPlatform && <Footer />}
    </div>
  );
}
