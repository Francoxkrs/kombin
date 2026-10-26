/** Faixa com o slogan correndo, no fim do Descobrir. */
export function MarqueeBand() {
  const words = ["lugares que combinam com você", "Campo Grande", "pra cada ocasião", "decida com a galera"];
  const row = [...words, ...words];
  return (
    <div className="mt-14 overflow-hidden border-y border-line py-4" aria-hidden>
      <div className="marquee flex w-max gap-8 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="display text-[2rem] text-foreground/90">
            {w} <span className="text-match">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
