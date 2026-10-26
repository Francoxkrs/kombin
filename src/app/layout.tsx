import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TabBar } from "@/components/ui/TabBar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kombin · lugares que combinam com você",
  description: "Escolha a ocasião e a comida e veja os lugares de Campo Grande que mais combinam com você.",
  applicationName: "Kombin",
  appleWebApp: { capable: true, title: "Kombin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="app-shell relative mx-auto min-h-dvh w-full max-w-md overflow-x-clip bg-white">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
