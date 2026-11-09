import { NextResponse } from "next/server";
import { analyzeByKeywords, analyzeWithAI, type Analysis } from "@/lib/analyze";
import { buildPrompt, generateImage } from "@/lib/generate";
import type { Locale } from "@/lib/locales";

export const runtime = "nodejs";
// 그림 생성은 보통 10~40초. 60초는 Vercel 무료(Hobby) 어떤 설정에서도 허용되는 값이에요.
// 시간 초과가 자주 나면 90~300으로 올리세요 (Fluid compute 켜진 프로젝트는 최대 300).
export const maxDuration = 60;

// 아주 간단한 IP별 하루 제한 (서버가 여러 대로 늘어나면 정확하지 않음 — 대략적인 안전장치)
const usage = new Map<string, { day: string; count: number }>();
function overLimit(ip: string) {
  const limit = Number(process.env.DAILY_LIMIT_PER_IP || 20);
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(ip);
  if (!u || u.day !== day) {
    usage.set(ip, { day, count: 1 });
    return false;
  }
  u.count += 1;
  return u.count > limit;
}

export async function POST(req: Request) {
  let body: { text?: string; locale?: Locale; size?: "portrait" | "square"; code?: string; variation?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = (body.text || "").trim().slice(0, 500);
  const locale: Locale = body.locale === "en" ? "en" : "ko";
  const size = body.size === "square" ? "square" : "portrait";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const accessCode = process.env.ACCESS_CODE;
  if (accessCode && body.code !== accessCode) {
    return NextResponse.json({ error: "code" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // 1) 글 분석
  let analysis: Analysis;
  if (apiKey) {
    try {
      analysis = await analyzeWithAI(text, locale, apiKey);
    } catch (e) {
      console.error(e);
      analysis = analyzeByKeywords(text, locale);
    }
  } else {
    analysis = analyzeByKeywords(text, locale);
  }

  // 키가 없으면 체험 모드: 브라우저가 간단한 배경을 그려요
  if (!apiKey) return NextResponse.json({ demo: true, analysis });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (overLimit(ip)) return NextResponse.json({ error: "limit", analysis }, { status: 429 });

  // 2) 그림 생성 ("다시 그리기"면 살짝 변주를 줘요)
  let prompt = buildPrompt(locale, analysis);
  if (body.variation) prompt += `\nVariation #${body.variation}: choose a different composition and camera angle than usual.`;
  try {
    const image = await generateImage(prompt, size, apiKey);
    return NextResponse.json({ image, analysis });
  } catch (e) {
    console.error(e);
    const msg = String(e);
    const blocked = msg.includes("moderation") || msg.includes("safety");
    return NextResponse.json({ error: blocked ? "blocked" : "image_failed", analysis }, { status: 502 });
  }
}
