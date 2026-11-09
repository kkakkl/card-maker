import { NextResponse } from "next/server";
import { analyzeByKeywords, analyzeWithAI, type Analysis } from "@/lib/analyze";
import { buildPrompt, generateImage } from "@/lib/generate";
import { rollIngredients } from "@/lib/motifs";
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
  let body: { text?: string; locale?: Locale; size?: "portrait" | "square"; code?: string; avoid?: string };
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

  // 0) 이번 카드의 무작위 재료 (소재 후보, 빛, 구도, 장식)
  const ing = rollIngredients(locale);
  // "다른 그림으로 다시"일 때 직전 장면과 겹치지 않게
  const avoid = typeof body.avoid === "string" ? body.avoid.slice(0, 300) : "";

  // 1) 글 분석
  let analysis: Analysis;
  if (apiKey) {
    try {
      analysis = await analyzeWithAI(text, locale, apiKey, ing, avoid);
    } catch (e) {
      console.error(e);
      analysis = analyzeByKeywords(text, locale, ing);
    }
  } else {
    analysis = analyzeByKeywords(text, locale, ing);
  }

  // 키가 없으면 체험 모드: 브라우저가 간단한 배경을 그려요
  if (!apiKey) return NextResponse.json({ demo: true, analysis });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (overLimit(ip)) return NextResponse.json({ error: "limit", analysis }, { status: 429 });

  // 2) 그림 생성
  const prompt = buildPrompt(locale, analysis, ing);
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
