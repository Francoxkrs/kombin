import { shortDay } from "@/lib/dashboard";

export interface BarSeries {
  label: string;
  /** Cor da barra. Validada contra o fundo escuro (surface) para daltonismo. */
  color: string;
  values: number[];
}

/** Cores para duas séries lado a lado (passam no teste de daltonismo sobre bg-surface). */
export const SERIES_COLORS = ["#b88600", "#4d8ad6"] as const;

const NARROW = 340;
const TOP = 14;
const BOTTOM = 20;

/**
 * Barras por dia, empilhadas quando há mais de uma série. Desenhado no servidor, sem JS:
 * passar o dedo ou o mouse numa barra mostra o dia e os números (title do SVG).
 */
export function BarChart({
  days,
  series,
  label,
  width: W = NARROW,
}: {
  days: string[];
  series: BarSeries[];
  label: string;
  /** Largura do desenho: maior em telas largas, para o texto não crescer junto com o gráfico. */
  width?: number;
}) {
  const props = { days, series, label };
  return (
    <figure>
      {series.length > 1 && (
        <figcaption className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-2">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: s.color }} aria-hidden />
              {s.label}: <b className="tabular-nums">{s.values.reduce((a, b) => a + b, 0)}</b>
            </span>
          ))}
        </figcaption>
      )}
      {/* Tela larga ganha um desenho mais largo, para o texto do eixo não crescer junto. */}
      {W > NARROW ? (
        <>
          <Plot {...props} W={NARROW} className="w-full lg:hidden" />
          <Plot {...props} W={W} className="hidden w-full lg:block" />
        </>
      ) : (
        <Plot {...props} W={W} className="w-full" />
      )}
    </figure>
  );
}

function Plot({ days, series, label, W, className }: { days: string[]; series: BarSeries[]; label: string; W: number; className: string }) {
  const H = W > NARROW ? 220 : 140;
  const totals = days.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const plotH = H - TOP - BOTTOM;
  const slot = W / days.length;
  const barW = Math.max(2, slot - 2);
  const y = (v: number) => (v / max) * plotH;
  const ticks = [0, Math.floor((days.length - 1) / 2), days.length - 1];

  return (
      <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
        <line x1={0} x2={W} y1={TOP} y2={TOP} stroke="var(--line)" strokeDasharray="2 4" />
        <text x={0} y={TOP - 4} fontSize={11} fill="var(--muted)">
          {max}
        </text>
        <line x1={0} x2={W} y1={TOP + plotH} y2={TOP + plotH} stroke="var(--line)" />
        {days.map((day, i) => {
          let base = TOP + plotH;
          const tip = `${shortDay(day)}: ${series.map((s) => `${s.values[i] ?? 0} ${s.label.toLowerCase()}`).join(", ")}`;
          return (
            <g key={day}>
              <title>{tip}</title>
              {/* Área de toque maior que a barra. */}
              <rect x={i * slot} y={TOP} width={slot} height={plotH} fill="transparent" />
              {series.map((s, k) => {
                const h = y(s.values[i] ?? 0);
                if (h <= 0) return null;
                // 2px de fundo entre segmentos empilhados.
                const gap = k > 0 ? 2 : 0;
                base -= h;
                return (
                  <rect
                    key={s.label}
                    x={i * slot + 1}
                    y={base}
                    width={barW}
                    height={Math.max(1, h - gap)}
                    rx={Math.min(2, barW / 2)}
                    fill={s.color}
                  />
                );
              })}
            </g>
          );
        })}
        {ticks.map((i, n) => (
          <text
            key={i}
            x={i * slot + slot / 2}
            y={H - 4}
            fontSize={11}
            fill="var(--muted)"
            textAnchor={n === 0 ? "start" : n === 2 ? "end" : "middle"}
          >
            {shortDay(days[i])}
          </text>
        ))}
      </svg>
  );
}
