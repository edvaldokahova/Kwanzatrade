import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { LoaderProvider } from "@/context/LoaderContext";

export const metadata: Metadata = {
  title: "KwanzaTrade — Ferramenta Indispensável para o Trader Angolano",
  description:
    "Lucre no Forex com o poder da IA. Receba insights em tempo real e notícias da Marketaux direto na plataforma feita para o investidor angolano.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark">
      <body className="antialiased bg-[#0b0b0c]">
        <LoaderProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </LoaderProvider>
      </body>
    </html>
  );
}
