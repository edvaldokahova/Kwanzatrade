import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { LoaderProvider } from "@/context/LoaderContext";

export const metadata: Metadata = {
  title: "KwanzaTrade IA",
  description:
    "Lucre no Forex com o poder da IA. Receba insights em tempo real e notícias da Marketaux direto na plataforma feita para o Trader angolano.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
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
