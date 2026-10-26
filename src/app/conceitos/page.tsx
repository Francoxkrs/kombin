import Link from "next/link";

const DIRECTIONS = [
  {
    href: "/conceitos/cores",
    place: "/conceitos/cores/lugar",
    name: "Cores de Campo Grande",
    idea: "Cada ocasião ganha uma cor da cidade: vinho, ipê-amarelo, arara-azul, pôr do sol, ipê-rosa, tereré. Escolheu a ocasião, o app inteiro muda de cor.",
    bg: "#FFC81E",
    ink: "#000000",
  },
  {
    href: "/conceitos/comanda",
    place: "/conceitos/comanda/lugar",
    name: "Comanda de boteco",
    idea: "A recomendação vira uma comanda: os motivos são os itens e o total é quanto o lugar combina. A ocasião é escolhida em fichas de festa.",
    bg: "#0E3B2C",
    ink: "#F2EEE3",
  },
  {
    href: "/conceitos/cinema",
    place: "/conceitos/cinema/lugar",
    name: "Tela cheia",
    idea: "Um lugar por tela, de ponta a ponta, como cartaz de cinema. Você passa o dedo pra cima e vê o próximo.",
    bg: "#2A1B12",
    ink: "#F6F0E6",
  },
];

export default function ConceitosPage() {
  return (
    <main className="min-h-dvh bg-white pb-16 text-black" style={{ fontFamily: "var(--f-archivo)" }}>
      <header className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[44px] leading-[0.9] font-extrabold uppercase" style={{ fontVariationSettings: '"wdth" 62' }}>
          Três caminhos pro Kombin
        </h1>
        <p className="mt-4 max-w-[34ch] text-[17px] leading-snug">
          Abra cada um no celular, toque na ocasião e no lugar. Depois escolha o que tem mais a cara do Kombin.
        </p>
      </header>
      <ol className="mt-8">
        {DIRECTIONS.map((d) => (
          <li key={d.href} className="px-4 py-7" style={{ background: d.bg, color: d.ink }}>
            <h2 className="text-[34px] leading-[0.9] font-extrabold uppercase" style={{ fontVariationSettings: '"wdth" 62' }}>
              {d.name}
            </h2>
            <p className="mt-3 max-w-[36ch] text-[16px] leading-snug">{d.idea}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link
                href={d.href}
                className="grid h-12 place-items-center text-[15px] font-semibold"
                style={{ background: d.ink, color: d.bg }}
              >
                Tela inicial
              </Link>
              <Link
                href={d.place}
                className="grid h-12 place-items-center border-2 text-[15px] font-semibold"
                style={{ borderColor: d.ink }}
              >
                Página do lugar
              </Link>
            </div>
          </li>
        ))}
      </ol>
      <p className="px-4 pt-6 text-[14px] text-[#555]">Fotos e números ilustrativos, só para comparar o visual.</p>
    </main>
  );
}
