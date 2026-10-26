import { Archivo, Barlow, Barlow_Condensed, Bricolage_Grotesque } from "next/font/google";

const archivo = Archivo({ variable: "--f-archivo", subsets: ["latin"], axes: ["wdth"] });
const barlow = Barlow({ variable: "--f-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const barlowCondensed = Barlow_Condensed({ variable: "--f-barlow-c", subsets: ["latin"], weight: ["600", "700", "800"] });
const bricolage = Bricolage_Grotesque({ variable: "--f-brico", subsets: ["latin"], axes: ["opsz", "wdth"] });

export const metadata = { title: "Direções visuais · Kombin", robots: { index: false } };

/** Protótipos das três direções visuais. Só para comparar; não fazem parte do app. */
export default function ConceitosLayout({ children }: LayoutProps<"/conceitos">) {
  return (
    <div className={`${archivo.variable} ${barlow.variable} ${barlowCondensed.variable} ${bricolage.variable}`}>{children}</div>
  );
}
