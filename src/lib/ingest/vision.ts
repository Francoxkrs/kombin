/**
 * "Curador de arte digital": manda as fotos de um lugar para um modelo de visão
 * e recebe notas de estética e de encaixe por ocasião.
 *
 * Provedores:
 *  - gemini (padrão): plano gratuito do Google AI Studio. GEMINI_API_KEY.
 *    Atenção: no plano gratuito o Google pode usar os dados enviados para treinar modelos.
 *  - anthropic: Claude Haiku, pago por uso (centavos para algumas centenas de lugares). ANTHROPIC_API_KEY.
 */
import { OCCASIONS } from "../occasions";

export interface VibeVerdict {
  aesthetic: number;
  occasions: Record<string, number>;
  noise: 1 | 2 | 3 | null;
  spend: 1 | 2 | 3 | 4 | null;
  summary: string;
}

export interface VisionImage {
  mimeType: string;
  base64: string;
}

const occasionList = OCCASIONS.map((o) => `- "${o.slug}": ${o.name} (${o.tagline})`).join("\n");

const PROMPT = `Você é o curador do Kombin, um app que recomenda lugares para comer e beber em Campo Grande (MS) por ocasião.
Analise as fotos do lugar "{NAME}" ({TYPE}). Avalie o AMBIENTE, não a qualidade técnica da foto.

Responda SOMENTE com JSON neste formato:
{
  "aesthetic": número 0-10,  // quão bonito, cuidado e "dá vontade de ir" é o ambiente. Poluído, mal iluminado ou sem identidade = nota baixa.
  "occasions": { ${OCCASIONS.map((o) => `"${o.slug}": 0-10`).join(", ")} },
  "noise": 1, 2 ou 3,         // 1 = dá pra conversar, 3 = alto/animado. null se impossível estimar.
  "spend": 1, 2, 3 ou 4,      // gasto por pessoa estimado: 1 até R$40, 2 R$40-80, 3 R$80-150, 4 R$150+. null se impossível.
  "summary": "frase curta (até 90 caracteres) que descreve o clima do ambiente, em português"
}

Ocasiões:
${occasionList}

Critério das ocasiões: avalie o encaixe do AMBIENTE com cada ocasião. Um boteco simples e animado pode ser 9 em "pagode" e 3 em "encontro". Não penalize lugares simples se forem ótimos para a ocasião deles.`;

function buildPrompt(name: string, type: string) {
  return PROMPT.replace("{NAME}", name).replace("{TYPE}", type || "restaurante");
}

function parseVerdict(text: string): VibeVerdict {
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const raw = JSON.parse(json) as Partial<VibeVerdict> & { occasions?: Record<string, unknown> };
  const num = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
  };
  const occasions: Record<string, number> = {};
  for (const o of OCCASIONS) {
    const n = num(raw.occasions?.[o.slug], 0, 10);
    if (n != null) occasions[o.slug] = Math.round(n * 10) / 10;
  }
  return {
    aesthetic: num(raw.aesthetic, 0, 10) ?? 0,
    occasions,
    noise: (num(raw.noise, 1, 3) != null ? Math.round(Number(raw.noise)) : null) as VibeVerdict["noise"],
    spend: (num(raw.spend, 1, 4) != null ? Math.round(Number(raw.spend)) : null) as VibeVerdict["spend"],
    summary: String(raw.summary ?? "").slice(0, 120),
  };
}

async function gemini(prompt: string, images: VisionImage[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Defina GEMINI_API_KEY (aistudio.google.com/apikey)");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...images.map((i) => ({ inline_data: { mime_type: i.mimeType, data: i.base64 } })),
              { text: prompt },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

async function anthropic(prompt: string, images: VisionImage[]): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Defina ANTHROPIC_API_KEY (console.anthropic.com)");
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((i) => ({
              type: "image",
              source: { type: "base64", media_type: i.mimeType, data: i.base64 },
            })),
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "";
}

export type VisionProvider = "gemini" | "anthropic";

export async function vibeCheck(
  provider: VisionProvider,
  name: string,
  type: string,
  images: VisionImage[],
): Promise<VibeVerdict> {
  const prompt = buildPrompt(name, type);
  const text = provider === "anthropic" ? await anthropic(prompt, images) : await gemini(prompt, images);
  return parseVerdict(text);
}

export function visionModelName(provider: VisionProvider): string {
  return provider === "anthropic"
    ? process.env.ANTHROPIC_MODEL || "claude-haiku-5-5"
    : process.env.GEMINI_MODEL || "gemini-2.5-flash";
}
