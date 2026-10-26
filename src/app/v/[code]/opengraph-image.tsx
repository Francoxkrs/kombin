import { ImageResponse } from "next/og";
import { getDecisionState } from "@/lib/decision";
import { OG, OG_SIZE, OgWordmark, ogFonts } from "@/lib/og";

export const alt = "Votação do Kombin";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Prévia do link da votação no grupo: a pergunta e os lugares, com o quanto combinam. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const state = await getDecisionState((await params).code, "");
  const options = state?.options.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG.noite,
          padding: "60px 80px",
          fontFamily: "Conversa",
          color: OG.leite,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <OgWordmark height={64} />
          {state && <div style={{ fontSize: 28, color: OG.muted }}>{state.occasion.name}</div>}
        </div>
        <div style={{ fontFamily: "Grito", fontSize: 96, letterSpacing: "-3px", lineHeight: 1, marginTop: 44 }}>
          Bora decidir? Vota aí.
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
          {options.map((o) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: `2px solid ${OG.line}`,
                padding: "16px 0",
                fontSize: 36,
              }}
            >
              <span>{o.name}</span>
              {o.compat !== null && (
                <span style={{ fontFamily: "Grito", color: OG.ipe, fontSize: 40 }}>{`${o.compat}%`}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
