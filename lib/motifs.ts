// 그림이 매번 비슷해지지 않도록, 카드를 만들 때마다 여기서 재료를 무작위로 뽑아 섞어요.
// 소재를 추가·삭제하고 싶으면 이 목록만 고치면 돼요. (그림 AI에게 가는 말이라 영어로 적어요)

import type { Locale } from "./locales";

// 판별 주인공 소재 후보 — 글 분석 AI가 이 중 어울리는 걸 고르거나, 글 내용에 맞게 직접 정해요
export const SUBJECTS: Record<Locale, string[]> = {
  ko: [
    "a big bouquet of pink peonies",
    "white magnolia blossoms on a branch",
    "blue and purple hydrangeas",
    "bright yellow forsythia branches",
    "red camellia flowers with glossy leaves",
    "a lotus pond with pink lotus flowers and lily pads",
    "a field of pink and white cosmos",
    "tall sunflowers",
    "white plum blossoms on an old twisted branch",
    "pink azaleas covering a hillside",
    "Korean rose of Sharon (mugunghwa) flowers",
    "a basket of red and pink carnations",
    "roses wrapped with baby's breath in a bouquet",
    "yellow freesias in a glass vase",
    "purple lilacs",
    "white lilies",
    "potted yellow chrysanthemums",
    "a field of red poppies",
    "a blooming cherry blossom tree",
    "a persimmon tree branch heavy with orange persimmons",
    "glossy peaches with peach blossoms",
    "a basket of shiny red apples and grapes",
    "a traditional Korean tea set with a steaming teacup and flowers",
    "hanok roof eaves with flowers in front",
    "earthenware jars (jangdokdae) surrounded by flowers",
    "a pair of red-crowned cranes",
    "a pair of colorful mandarin ducks on a pond",
    "orange koi fish in a clear pond",
    "a round goldfish bowl with flowers beside it",
    "a little bluebird perched on a flowering branch",
    "a heart-shaped wreath of mixed flowers",
    "a gift box tied with a big satin ribbon and flowers",
    "a cute fluffy puppy sitting among flowers",
    "a kitten peeking out of a flower basket",
    "a family of little yellow ducklings",
    "a waterfall with rainbow mist",
    "a country road lined with ginkgo trees",
    "a small thatched-roof cottage in the countryside",
  ],
  en: [
    "a cascade of purple orchids",
    "a wisteria arch in full bloom",
    "a lavender field",
    "blue and pink hydrangeas",
    "pink roses spilling out of a vintage teacup",
    "a bouquet of daisies in a mason jar",
    "morning glory vines on a white fence",
    "white magnolias",
    "tulips in a vintage watering can",
    "sunflowers in a country field",
    "pink peonies",
    "white calla lilies",
    "a red cardinal on a snowy branch",
    "a pair of bluebirds on a blossoming branch",
    "a hummingbird at a hibiscus flower",
    "monarch butterflies on purple coneflowers",
    "white doves in flight",
    "a pair of white swans on a lake",
    "a kitten sleeping in a basket of flowers",
    "a cute puppy holding a flower",
    "a porcelain teapot and teacups with roses",
    "a steaming coffee mug with heart latte art and cookies",
    "pastel cupcakes with frosting roses",
    "a cozy country cottage with a flower garden",
    "a white picket fence with climbing roses",
    "a lighthouse at sunrise",
    "an old covered bridge over a stream",
    "a white gazebo in a garden",
    "a porch rocking chair with potted flowers",
    "a little white church in a wildflower meadow",
    "a waterfall with a rainbow",
    "an open Bible with a rose and soft glowing light",
    "a heart-shaped wreath of roses",
    "a vintage birdhouse covered in flowers",
    "a horse-drawn carriage on a country lane",
    "an autumn forest path with golden leaves",
  ],
};

// 구도 — 매번 무작위 (참고 이미지들에서 나온 구도 위주)
export const COMPOSITIONS = [
  "one giant glossy bloom in close-up filling most of the frame",
  "a lush bouquet in a vase centered on a lace-covered table",
  "a heart-shaped frame made of flowers and vines",
  "flowers bordering all four edges like a frame with a softer center",
  "a wide landscape with flowers large in the foreground",
  "a low-angle view looking up through flowers at the sky",
  "a cozy still life on a wooden table by a sunny window",
  "flowers overflowing from a basket",
  "a circular floral wreath",
  "a diagonal composition with a flowering branch reaching in from one corner",
];

// 빛과 시간대 — 글 분석 AI가 둘 중 글에 맞는 걸 골라요
export const LIGHTING = [
  "golden sunrise light",
  "soft misty morning",
  "bright sunny day with a clear blue sky",
  "pink and orange sunset glow",
  "moonlit night with twinkling stars",
  "heavenly light rays through clouds",
  "dreamy pastel bokeh background",
  "sparkling purple galaxy sky",
  "fresh light after rain with dew drops",
];

// 곁들이 장식 — 매번 1~2개 무작위
export const ACCENTS = [
  "a few fluttering butterflies",
  "floating sparkling hearts",
  "falling petals",
  "glittering dew drops",
  "satin ribbons and pearls",
  "tiny singing birds",
  "soft glowing bokeh circles",
  "a delicate rainbow",
  "drifting glitter dust",
  "lace and ribbon details",
];

export function pick<T>(arr: T[], n = 1): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

export interface Ingredients {
  subjectIdeas: string[];
  lightingIdeas: string[];
  composition: string;
  accents: string[];
}

export function rollIngredients(locale: Locale): Ingredients {
  return {
    subjectIdeas: pick(SUBJECTS[locale], 4),
    lightingIdeas: pick(LIGHTING, 2),
    composition: pick(COMPOSITIONS)[0],
    accents: pick(ACCENTS, 1 + Math.floor(Math.random() * 2)),
  };
}
