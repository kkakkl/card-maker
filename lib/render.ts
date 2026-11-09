// 브라우저에서 배경 그림 위에 글씨·반짝이·액자를 얹어 최종 카드 이미지를 만드는 부분.

import type { FontOption, Placement, TextStyleId } from "./locales";

export interface RenderOptions {
  background: HTMLImageElement | null; // AI 그림 (없으면 체험 배경)
  palette: string[];
  text: string;
  font: FontOption;
  style: TextStyleId;
  placement: Placement;
  width: number;
  height: number;
  frame: boolean;
  seed: number;
}

// 같은 seed면 반짝이 위치가 같게 (글씨 바꿀 때 반짝이가 막 움직이지 않도록)
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export async function ensureFont(font: FontOption, text: string) {
  try {
    await document.fonts.load(`${font.weight} 64px "${font.family}"`, text || "가A");
  } catch {
    /* 폰트 로딩 실패해도 기본 글꼴로 그려짐 */
  }
}

export function renderCard(canvas: HTMLCanvasElement, o: RenderOptions) {
  const W = o.width;
  const H = o.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(o.seed);

  // 1) 배경
  if (o.background) {
    drawCover(ctx, o.background, W, H);
  } else {
    drawDemoBackground(ctx, o.palette, W, H, rand);
  }

  // 2) 글씨 뒤를 살짝 밝게/어둡게 해서 잘 읽히게
  const lines = layoutText(ctx, o, W);
  const block = measureBlock(lines);
  const top = blockTop(o.placement, block.height, H);
  const glow = ctx.createRadialGradient(W / 2, top + block.height / 2, 0, W / 2, top + block.height / 2, Math.max(W, block.height) * 0.7);
  const dark = o.style === "white3d" || o.style === "chrome";
  glow.addColorStop(0, dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 3) 반짝이
  drawSparkles(ctx, W, H, rand, 26);

  // 4) 글씨
  let y = top;
  lines.forEach((ln, i) => {
    y += ln.size * 0.95;
    drawLine(ctx, ln.text, W / 2, y, ln.size, o, i);
    y += ln.size * 0.35;
  });

  // 5) 액자 (영어판 PicMix 느낌)
  if (o.frame) drawGlitterFrame(ctx, W, H, rand, o.style);
}

/* ---------- 배경 ---------- */

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const r = Math.max(W / img.width, H / img.height);
  const w = img.width * r;
  const h = img.height * r;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

// 체험 모드: AI 없이 그라데이션 + 보케 + 간단한 꽃
function drawDemoBackground(ctx: CanvasRenderingContext2D, pal: string[], W: number, H: number, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, pal[2] || "#fff");
  g.addColorStop(0.5, pal[0]);
  g.addColorStop(1, pal[1] || pal[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.2})`;
    ctx.arc(rand() * W, rand() * H, 10 + rand() * W * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  // 아래쪽에 꽃
  for (let i = 0; i < 9; i++) {
    const x = rand() * W;
    const y = H * (0.72 + rand() * 0.3);
    const r = W * (0.06 + rand() * 0.07);
    const petal = pal[i % 2 === 0 ? 0 : 1] || "#ff4d6d";
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.fillStyle = petal;
      ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, r * 0.35, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = "#FFE45C";
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSparkles(ctx: CanvasRenderingContext2D, W: number, H: number, rand: () => number, n: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const s = W * (0.008 + rand() * 0.03);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowColor = "white";
    ctx.shadowBlur = s;
    ctx.beginPath();
    // 4방향 별
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fill();
  }
  ctx.restore();
}

function drawGlitterFrame(ctx: CanvasRenderingContext2D, W: number, H: number, rand: () => number, style: TextStyleId) {
  const t = W * 0.035;
  const base = style === "gold" ? ["#8a6100", "#ffe27a"] : style === "chrome" ? ["#555", "#f4f4f4"] : ["#4b0f6b", "#e6a8ff"];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, base[0]);
  g.addColorStop(0.5, base[1]);
  g.addColorStop(1, base[0]);
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.rect(t, t, W - 2 * t, H - 2 * t);
  ctx.fill("evenodd");
  // 반짝이 점
  for (let i = 0; i < 500; i++) {
    const side = Math.floor(rand() * 4);
    const along = rand();
    const depth = rand() * t;
    const x = side === 0 ? along * W : side === 1 ? W - depth : side === 2 ? along * W : depth;
    const y = side === 0 ? depth : side === 1 ? along * H : side === 2 ? H - depth : along * H;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
    ctx.fillRect(x, y, 2 + rand() * 3, 2 + rand() * 3);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(t, t, W - 2 * t, H - 2 * t);
  ctx.restore();
}

/* ---------- 글씨 배치 ---------- */

interface Line {
  text: string;
  size: number;
}

function layoutText(ctx: CanvasRenderingContext2D, o: RenderOptions, W: number): Line[] {
  const raw = o.text.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!raw.length) return [];
  const maxW = W * (o.frame ? 0.82 : 0.88);
  const isScript = o.style === "glitter" || o.style === "gold" || o.style === "chrome";
  const headSize = W * (isScript ? 0.14 : 0.12) * o.font.scale;
  const bodySize = W * (raw.length > 4 ? 0.06 : 0.072) * o.font.scale;

  const out: Line[] = [];
  raw.forEach((line, i) => {
    let size = i === 0 ? headSize : bodySize;
    // 제목이 너무 길면 줄이기 (최소 본문 크기까지)
    ctx.font = `${o.font.weight} ${size}px "${o.font.family}"`;
    if (i === 0) {
      while (ctx.measureText(line).width > maxW && size > bodySize * 1.15) {
        size *= 0.93;
        ctx.font = `${o.font.weight} ${size}px "${o.font.family}"`;
      }
    }
    wrap(ctx, line, maxW).forEach((t) => out.push({ text: t, size }));
  });

  // 전체가 너무 높으면 비율로 줄이기
  const total = measureBlock(out).height;
  const limit = o.height * 0.86;
  if (total > limit) {
    const k = limit / total;
    out.forEach((l) => (l.size *= k));
  }
  return out;
}

// 한글은 글자 단위, 영어는 단어 단위로 줄바꿈
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  if (ctx.measureText(text).width <= maxW) return [text];
  const tokens = text.includes(" ") ? text.split(/(\s+)/) : [...text];
  const lines: string[] = [];
  let cur = "";
  for (const tk of tokens) {
    const next = cur + tk;
    if (ctx.measureText(next).width > maxW && cur.trim()) {
      lines.push(cur.trim());
      cur = tk.trimStart();
    } else {
      cur = next;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function measureBlock(lines: Line[]) {
  return { height: lines.reduce((h, l) => h + l.size * 1.3, 0) };
}

function blockTop(p: Placement, blockH: number, H: number) {
  if (p === "top") return H * 0.07;
  if (p === "bottom") return H - blockH - H * 0.07;
  return (H - blockH) / 2;
}

/* ---------- 글씨 스타일 ---------- */

const RAINBOW = ["#FFF200", "#FF2E2E", "#7CFF3A", "#FFFFFF", "#FF9DF0"];

function drawLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, o: RenderOptions, index: number) {
  ctx.save();
  ctx.font = `${o.font.weight} ${size}px "${o.font.family}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const outline = (color: string, w: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.strokeText(text, x, y);
  };

  switch (o.style) {
    case "rainbow": {
      // 첫 줄 노랑, 이후 빨강/초록/흰… 굵은 검정 테두리
      outline("#111", size * 0.2);
      ctx.fillStyle = RAINBOW[index % RAINBOW.length];
      ctx.fillText(text, x, y);
      break;
    }
    case "yellowOutline": {
      outline("#fff", size * 0.26);
      outline("#1a1a1a", size * 0.14);
      ctx.fillStyle = index === 0 ? "#FFE600" : "#FF2B2B";
      ctx.fillText(text, x, y);
      break;
    }
    case "white3d": {
      // 아래로 여러 겹 그려서 입체감
      ctx.fillStyle = "#1b1b1b";
      const depth = Math.max(3, size * 0.07);
      for (let d = depth; d > 0; d -= 1.5) ctx.fillText(text, x + d * 0.6, y + d);
      outline("#1b1b1b", size * 0.12);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = size * 0.15;
      ctx.fillText(text, x, y);
      break;
    }
    case "redPop": {
      outline("#ffffff", size * 0.22);
      ctx.fillStyle = "#E3001B";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowOffsetY = size * 0.05;
      ctx.shadowBlur = size * 0.08;
      ctx.fillText(text, x, y);
      break;
    }
    case "glitter": {
      ctx.shadowColor = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = size * 0.35;
      outline("#4a0f6b", size * 0.1);
      ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(0, y - size, 0, y);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.55, "#f0d4ff");
      g.addColorStop(1, "#c77dff");
      ctx.fillStyle = g;
      ctx.fillText(text, x, y);
      break;
    }
    case "gold": {
      outline("#1a0f00", size * 0.14);
      const g = ctx.createLinearGradient(0, y - size, 0, y);
      g.addColorStop(0, "#fffbd1");
      g.addColorStop(0.45, "#ffd700");
      g.addColorStop(1, "#c98a00");
      ctx.fillStyle = g;
      ctx.fillText(text, x, y);
      break;
    }
    case "chrome": {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowOffsetY = size * 0.05;
      ctx.shadowBlur = size * 0.1;
      outline("#2b2b2b", size * 0.12);
      ctx.shadowColor = "transparent";
      const g = ctx.createLinearGradient(0, y - size, 0, y);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, "#cfcfcf");
      g.addColorStop(0.5, "#c0102a");
      g.addColorStop(0.62, "#f5f5f5");
      g.addColorStop(1, "#8d8d8d");
      ctx.fillStyle = g;
      ctx.fillText(text, x, y);
      break;
    }
  }
  ctx.restore();
}
