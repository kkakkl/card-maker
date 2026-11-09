// 입력한 인사말을 분석해서 "어떤 그림을 그릴지" 정하는 부분.
// 1순위: AI(글 모델)가 분석 → 실패하거나 키가 없으면 2순위: 키워드 규칙으로 분석.

import { LOCALES, type Locale, type Placement, type TextStyleId } from "./locales";

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
const RULES: Rule[] = [
  { words: ["월요일", "monday", "한주", "한 주", "week"], scene: "a bright field of yellow tulips under a clear blue sky with a sun flare, a few butterflies", palette: ["#4FA3FF", "#FFE14D", "#3CB043"] },
  { words: ["화요일", "tuesday"], scene: "pink cosmos flowers swaying in a sunny meadow with sparkling dew", palette: ["#FF8FC7", "#FFF0F5", "#7BC86C"] },
  { words: ["수요일", "wednesday"], scene: "a bouquet of colorful carnations in a glass vase by a sunny window", palette: ["#FF6F61", "#FFD1DC", "#FFF8E7"] },
  { words: ["목요일", "thursday"], scene: "purple lilacs and white daisies with butterflies in soft morning light", palette: ["#B57EDC", "#FFFFFF", "#8FBC8F"] },
  { words: ["금요일", "friday", "불금"], scene: "sunflowers and a cheerful garden with balloons of light and hearts", palette: ["#FFC300", "#FF5733", "#87CEEB"] },
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
  { words: ["행복", "happy", "happiness", "기쁨", "joy", "웃"], scene: "a rainbow over a flower garden full of roses, tulips and daisies, butterflies and sparkles everywhere", palette: ["#FF6F91", "#FFC75F", "#4FC3F7"] },
  { words: ["아침", "morning", "굿모닝", "좋은"], scene: "a sunrise over a garden of purple orchids and roses, dew drops sparkling, white doves in the sky", palette: ["#FFB347", "#B57EDC", "#87CEEB"] },
];

const STYLE_BY_LOCALE: Record<Locale, TextStyleId[]> = {
  ko: ["rainbow", "yellowOutline", "white3d", "redPop"],
  en: ["glitter", "gold", "chrome", "white3d"],
};

export function analyzeByKeywords(text: string, locale: Locale): Analysis {
  const lower = text.toLowerCase();
  const hits = RULES.filter((r) => r.words.some((w) => lower.includes(w)));
  // 가장 구체적인(먼저 매칭된) 2개까지 섞기
  const picked = hits.slice(0, 2);
  const fallback = locale === "ko"
    ? RULES.find((r) => r.words.includes("행복"))!
    : RULES.find((r) => r.words.includes("morning"))!;
  const chosen = picked.length ? picked : [fallback];
  const scene = chosen.map((r) => r.scene).join(", combined with ");
  // 글이 길면 아래쪽까지 쓰이니 가운데, 짧으면 위쪽
  const lines = text.split("\n").filter(Boolean).length;
  const placement: Placement = lines >= 4 ? "center" : "top";
  // 문장 해시로 스타일을 고르면 같은 글은 늘 같은 결과
  const hash = [...text].reduce((a, c) => a + c.charCodeAt(0), 0);
  const styles = STYLE_BY_LOCALE[locale];
  return {
    scene,
    placement,
    textStyle: styles[hash % 2 === 0 ? 0 : 1],
    palette: chosen[0].palette,
    source: "keywords",
  };
}

export async function analyzeWithAI(text: string, locale: Locale, apiKey: string): Promise<Analysis> {
  const cfg = LOCALES[locale];
  const styles = STYLE_BY_LOCALE[locale];
  const system = `You design old-fashioned greeting e-cards that older adults share on messenger apps.
Given the greeting text, decide the background picture. Reply with JSON only:
{"scene": "<one vivid English sentence describing the picture: main flowers/objects, setting, light. Pick motifs that fit the meaning, season, weekday, or faith of the text. No text in picture.>",
 "placement": "top" | "center" | "bottom"  (where the lettering will go; the picture should keep that area calm),
 "textStyle": one of ${JSON.stringify(styles)},
 "palette": ["#hex","#hex","#hex"]}
Style reference for this audience: ${cfg.aesthetic}`;

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
  const fallback = analyzeByKeywords(text, locale);
  return {
    scene: typeof parsed.scene === "string" && parsed.scene.length > 10 ? parsed.scene : fallback.scene,
    placement: ["top", "center", "bottom"].includes(parsed.placement) ? parsed.placement : fallback.placement,
    textStyle: styles.includes(parsed.textStyle) ? parsed.textStyle : fallback.textStyle,
    palette: Array.isArray(parsed.palette) && parsed.palette.length >= 2 ? parsed.palette.slice(0, 3) : fallback.palette,
    source: "ai",
  };
}
