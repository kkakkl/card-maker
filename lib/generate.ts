// 그림 AI 호출 부분. 다른 회사 모델(Gemini, Flux 등)로 바꾸고 싶으면 이 파일만 고치면 돼요.
// 중요: AI에게는 "글씨 없는 배경"만 그리게 하고, 글씨는 브라우저에서 폰트로 얹어요.
//       (AI는 한글을 자주 틀리게 그리고, 이렇게 하면 글을 고쳐도 그림을 다시 안 그려도 돼요)

import { BASE_IMAGE_STYLE, LOCALES, type Locale } from "./locales";
import type { Analysis } from "./analyze";
import type { Ingredients } from "./motifs";

const CALM_AREA: Record<Analysis["placement"], string> = {
  top: "Keep the upper third of the image softer and less busy (sky, glow or blurred background) so lettering can be placed there; main subjects in the lower two thirds.",
  center: "Keep the middle of the image softer and less busy so lettering can be placed there; flowers and subjects framing the edges and corners.",
  bottom: "Keep the lower third softer and less busy so lettering can be placed there; main subjects in the upper two thirds.",
};

export function buildPrompt(locale: Locale, a: Analysis, ing: Ingredients) {
  return [
    BASE_IMAGE_STYLE,
    LOCALES[locale].aesthetic,
    `Scene: ${a.scene}.`,
    `Preferred composition: ${ing.composition} (adapt it naturally if it doesn't suit the scene).`,
    `Little extras: ${ing.accents.join(" and ")}.`,
    CALM_AREA[a.placement],
  ].join("\n");
}

export async function generateImage(prompt: string, size: "portrait" | "square", apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt,
      n: 1,
      size: size === "portrait" ? "1024x1536" : "1024x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
      // JPEG로 받아야 Vercel 응답 크기 제한(4.5MB) 안에 여유 있게 들어가요
      output_format: "jpeg",
      output_compression: 85,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`image ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("image: empty response");
  return `data:image/jpeg;base64,${b64}`;
}
