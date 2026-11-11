import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { TabBar } from "@/components/ui/TabBar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-brico",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

export const metadata: Metadata = {
  title: "Kombin · lugares que combinam com você",
  description: "Escolha o momento e veja os lugares de Campo Grande que mais combinam com você.",
  applicationName: "Kombin",
  appleWebApp: { capable: true, title: "Kombin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#2a1b12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-clip bg-background has-[[data-wide]]:max-w-none">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
