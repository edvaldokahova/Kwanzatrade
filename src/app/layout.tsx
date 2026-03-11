// src/app/layout.tsx
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { LoaderProvider } from "@/context/LoaderContext";

export const metadata = {
  title: "KwanzaTrade — Inteligência Artificial para o Trader Angolano",
  description:
    "Lucre no Forex com o poder da IA. Receba insights em tempo real e notícias da Marketaux direto na plataforma feita para o investidor angolano.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-[#0b0b0c] text-gray-200 min-h-screen flex flex-col">
        {/* O Provider envolve toda a aplicação para que o Loader funcione globalmente */}
        <LoaderProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </LoaderProvider>
      </body>
    </html>
  );
}