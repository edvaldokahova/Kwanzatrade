import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { LoaderProvider } from "@/context/LoaderContext";

export const metadata: Metadata = {
  title: "KwanzaTrade — Inteligência Artificial para o Trader Angolano",
  description:
    "Lucre no Forex com o poder da IA. Receba insights em tempo real e notícias da Marketaux direto na plataforma feita para o investidor angolano.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-[#0b0b0c] text-gray-200 antialiased min-h-screen">
        <LoaderProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </LoaderProvider>
      </body>
    </html>
  );
}
