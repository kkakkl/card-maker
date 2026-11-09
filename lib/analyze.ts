// 입력한 인사말을 분석해서 "어떤 그림을 그릴지" 정하는 부분.
// 1순위: AI(글 모델)가 분석 → 실패하거나 키가 없으면 2순위: 키워드 규칙으로 분석.

import { LOCALES, type Locale, type Placement, type TextStyleId } from "./locales";
import { pick, type Ingredients } from "./motifs";

export interface Analysis {
  scene: string; // 그림 AI에게 줄 장면 설명 (영어)
  placement: Placement; // 글씨가 들어갈 자리 (그림은 이 자리를 비워둠)
  textStyle: TextStyleId; // 어울리는 글씨 색
  palette: string[]; // 체험 모드 배경 색
  source: "ai" | "keywords";
}

interface Rule {
  words: string[];
  scene: string;
  palette: string[];
}

// 키워드 → 그림 소재. 필요하면 자유롭게 추가하세요.
// '아침·행복·요일'처럼 거의 모든 인사에 들어가는 단어는 넣지 마세요 — 그림이 매번 같아져요.
const RULES: Rule[] = [
  { words: ["주말", "토요일", "일요일", "weekend", "saturday", "sunday"], scene: "a peaceful lakeside with sailboats, white swans, pink lotus flowers and red roses in the foreground", palette: ["#3A8DDE", "#FF4D6D", "#7CC576"] },
  { words: ["건강", "health", "healthy", "평안", "무병"], scene: "a basket of glossy peaches and green apples beside pink peonies, golden morning light, a red-crowned crane flying in the distance", palette: ["#FF9A8B", "#7ED957", "#FFF3B0"] },
  { words: ["감사", "기도", "축복", "하나님", "주님", "아멘", "bless", "god", "lord", "pray", "amen", "jesus", "blessed"], scene: "heavenly golden light rays through soft clouds, white doves flying, white lilies and pink roses, a gentle glowing sky", palette: ["#FFE7A0", "#C9B6FF", "#FFFFFF"] },
  { words: ["사랑", "love", "hug", "hugs", "♡", "❤", "보고싶", "miss you", "thinking of you"], scene: "a huge glossy red rose with sparkling red hearts floating around it, a butterfly resting on a petal", palette: ["#E0002A", "#FF8FA3", "#F7E8E8"] },
  { words: ["커피", "차 한잔", "차한잔", "coffee", "tea", "latte"], scene: "a steaming white coffee cup with heart latte art on a saucer, heart-shaped chocolate cookies, purple orchids and a pink ribbon", palette: ["#8B5A2B", "#C77DFF", "#F5E6D3"] },
  { words: ["비", "rain", "rainy", "장마"], scene: "a cozy window with raindrops, a warm cup of tea, pink hydrangeas blooming outside", palette: ["#7FA7C9", "#E3A5D0", "#F0F4F8"] },
  { words: ["봄", "spring", "벚꽃", "cherry"], scene: "a path lined with blooming cherry blossom trees, petals falling like snow, soft pink sky", palette: ["#FFB7C5", "#FFFFFF", "#A0D8EF"] },
  { words: ["여름", "summer", "바다", "beach", "sea"], scene: "a turquoise sea and white sand beach with tropical hibiscus flowers and a bright sun", palette: ["#00B4D8", "#FFD166", "#EF476F"] },
  { words: ["가을", "autumn", "fall", "단풍", "추석", "한가위", "thanksgiving"], scene: "a full harvest moon over golden rice fields, red maple leaves, persimmons and chrysanthemums", palette: ["#FF8C00", "#B22222", "#FFD700"] },
  { words: ["겨울", "winter", "눈", "snow", "christmas", "크리스마스", "성탄"], scene: "a snowy cabin with warm glowing windows, red poinsettias, twinkling lights and falling snow", palette: ["#C1121F", "#FFFFFF", "#2A6F97"] },
  { words: ["새해", "설날", "new year", "복 많이"], scene: "a golden sunrise over mountains, plum blossoms, lucky pouches, festive sparkles", palette: ["#FF4500", "#FFD700", "#C71585"] },
  { words: ["생일", "birthday", "축하", "congrat"], scene: "a birthday cake with candles surrounded by roses, balloons and confetti sparkles", palette: ["#FF69B4", "#FFD700", "#87CEFA"] },
  { words: ["밤", "night", "잘자", "꿈", "dream", "good night"], scene: "a crescent moon and stars over a calm lake at night, glowing roses and sparkling fireflies", palette: ["#1B1B4B", "#6A5ACD", "#FFD1F5"] },
  { words: ["늙", "나이", "청춘", "세월", "인생", "life", "age"], scene: "big pink roses in front of a dreamy full moon and starry purple sky, a yellow butterfly on top, white and red roses below", palette: ["#FF4FB8", "#5B5BD6", "#FFE45C"] },
];

const PALETTES = [
  ["#FF6F91", "#FFC75F", "#4FC3F7"],
  ["#B57EDC", "#FFD1F5", "#7BC86C"],
  ["#FF8C42", "#FFF3B0", "#3A8DDE"],
  ["#E0002A", "#FFB7C5", "#FFFFFF"],
  ["#00B4D8", "#FFD166", "#EF476F"],
];

const STYLE_BY_LOCALE: Record<Locale, TextStyleId[]> = {
  ko: ["rainbow", "yellowOutline", "white3d", "redPop"],
  en: ["glitter", "gold", "chrome", "white3d"],
};

export function analyzeByKeywords(text: string, locale: Locale, ing: Ingredients): Analysis {
  const lower = text.toLowerCase();
  const hits = RULES.filter((r) => r.words.some((w) => lower.includes(w)));
  // 요일·계절·명절처럼 구체적인 주제가 있으면 그 장면, 없으면 오늘의 무작위 소재로
  const chosen = hits.length ? [hits[0]] : [];
  const scene = chosen.length
    ? chosen[0].scene
    : `${ing.subjectIdeas[0]}, ${ing.lightingIdeas[0]}`;
  if (!chosen.length) chosen.push({ words: [], scene, palette: pick(PALETTES)[0] });
  // 글이 길면 아래쪽까지 쓰이니 가운데, 짧으면 위쪽
  const lines = text.split("\n").filter(Boolean).length;
  const placement: Placement = lines >= 4 ? "center" : "top";
  const styles = STYLE_BY_LOCALE[locale];
  return {
    scene,
    placement,
    textStyle: pick(styles.slice(0, 2))[0],
    palette: chosen[0].palette,
    source: "keywords",
  };
}

export async function analyzeWithAI(text: string, locale: Locale, apiKey: string, ing: Ingredients, avoid = ""): Promise<Analysis> {
  const cfg = LOCALES[locale];
  const styles = STYLE_BY_LOCALE[locale];
  const system = `You design old-fashioned greeting e-cards that older adults share on messenger apps.
Given the greeting text, decide the background picture. Reply with JSON only:
{"scene": "<one vivid English sentence: the main subject, the setting, and the light. No text in picture.>",
 "placement": "top" | "center" | "bottom"  (where the lettering will go; the picture should keep that area calm),
 "textStyle": one of ${JSON.stringify(styles)},
 "palette": ["#hex","#hex","#hex"]}

Variety matters: these cards get sent every day, so they must not all look alike.
- If the text clearly names a subject, season, holiday, weekday mood, weather or faith theme, build the scene around that.
- Otherwise pick the main subject from today's ideas: ${ing.subjectIdeas.join("; ")}.
- Light: choose whichever fits the text from: ${ing.lightingIdeas.join("; ")} (a night greeting always gets night light).
- Do NOT default to red roses or yellow tulips unless the text calls for them.${avoid ? `\n- The user asked for a different picture. The previous one was: "${avoid}". Use a clearly different main subject and setting.` : ""}
Look of this audience: ${cfg.aesthetic}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: text.slice(0, 500) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`analyze ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  const fallback = analyzeByKeywords(text, locale, ing);
  return {
    scene: typeof parsed.scene === "string" && parsed.scene.length > 10 ? parsed.scene : fallback.scene,
    placement: ["top", "center", "bottom"].includes(parsed.placement) ? parsed.placement : fallback.placement,
    textStyle: styles.includes(parsed.textStyle) ? parsed.textStyle : fallback.textStyle,
    palette: Array.isArray(parsed.palette) && parsed.palette.length >= 2 ? parsed.palette.slice(0, 3) : fallback.palette,
    source: "ai",
  };
}
