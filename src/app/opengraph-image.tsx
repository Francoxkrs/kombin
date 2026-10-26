import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OgWordmark, ogFonts } from "@/lib/og";

export const alt = "Kombin, lugares que combinam com você";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: OG.noite,
          padding: "72px 80px",
          fontFamily: "Conversa",
        }}
      >
        <OgWordmark height={150} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              fontFamily: "Grito",
              fontSize: 92,
              lineHeight: 0.95,
              letterSpacing: "-2px",
              color: OG.leite,
              maxWidth: 640,
            }}
          >
            lugares que combinam com você
          </div>
          <div style={{ fontSize: 28, color: OG.muted }}>Campo Grande</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
