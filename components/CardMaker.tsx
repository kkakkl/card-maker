"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LOCALES, type Locale, type Placement, type TextStyleId } from "@/lib/locales";
import { ensureFont, renderCard } from "@/lib/render";

type Analysis = { scene: string; placement: Placement; textStyle: TextStyleId; palette: string[]; source: string };

export default function CardMaker({ locale }: { locale: Locale }) {
  const cfg = LOCALES[locale];
  const t = cfg.ui;

  const [text, setText] = useState(cfg.presets[0].text);
  const [fontId, setFontId] = useState(cfg.fonts[0].id);
  const [style, setStyle] = useState<TextStyleId>(cfg.defaultStyle);
  const [placement, setPlacement] = useState<Placement>("top");
  const [size, setSize] = useState(cfg.defaultSize);
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);

  const [bg, setBg] = useState<HTMLImageElement | null>(null);
  const [palette, setPalette] = useState<string[]>(["#FF6F91", "#FFC75F", "#4FC3F7"]);
  const [cardSize, setCardSize] = useState<"portrait" | "square">(cfg.defaultSize);
  const [hasCard, setHasCard] = useState(false);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastScene, setLastScene] = useState("");
  const [seed, setSeed] = useState(7);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // 완성된 카드 파일을 미리 만들어 둬요. 휴대폰(특히 아이폰)은 버튼을 누른 "바로 그 순간"에
  // 공유를 시작해야 해서, 누른 뒤에 파일을 만들면 공유창이 막혀요.
  const blobRef = useRef<Blob | null>(null);
  const [imgUrl, setImgUrl] = useState("");
  const font = cfg.fonts.find((f) => f.id === fontId) ?? cfg.fonts[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("card-code");
      if (saved) setCode(saved);
    } catch {}
  }, []);

  // 글씨/스타일이 바뀌면 그림은 그대로 두고 바로 다시 그리기
  const draw = useCallback(async () => {
    if (!hasCard || !canvasRef.current) return;
    await ensureFont(font, text);
    renderCard(canvasRef.current, {
      background: bg,
      palette,
      text,
      font,
      style,
      placement,
      width: 1024,
      height: cardSize === "portrait" ? 1536 : 1024,
      frame: cfg.frame,
      seed,
    });
    const blob = await new Promise<Blob | null>((resolve) => {
      const c = canvasRef.current;
      if (!c) return resolve(null);
      c.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) return;
    blobRef.current = blob;
    // 화면에는 <img>로 보여줘요 → 휴대폰에서 길게 눌러 저장도 가능
    const url = URL.createObjectURL(blob);
    setImgUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  }, [hasCard, bg, palette, text, font, style, placement, cardSize, cfg.frame, seed]);

  useEffect(() => {
    draw();
  }, [draw]);

  async function make(redraw = false) {
    if (!text.trim()) return setError(t.empty);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale, size, code, avoid: redraw ? lastScene : "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "code") {
          setNeedCode(true);
          setError(t.errCode);
        } else if (data.error === "limit") setError(t.errLimit);
        else if (data.error === "blocked") setError(t.errBlocked);
        else setError(t.errFailed);
        return;
      }
      try {
        if (code) localStorage.setItem("card-code", code);
      } catch {}
      const a: Analysis = data.analysis;
      // 처음 만들 때만 AI 추천 위치/색을 적용 (다시 그리기 때는 사용자가 고른 것 유지)
      if (!redraw) {
        setPlacement(a.placement);
        setStyle(a.textStyle);
      }
      setPalette(a.palette);
      setLastScene(a.scene);
      setSeed(Math.floor(Math.random() * 100000) + 1);
      setCardSize(size);
      if (data.image) {
        const img = new Image();
        img.src = data.image;
        await img.decode();
        setBg(img);
        setDemo(false);
      } else {
        setBg(null);
        setDemo(true);
      }
      setHasCard(true);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  }

  function fileName() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    // 일부 안드로이드 브라우저가 한글 파일명을 깨뜨려서 영어로
    return `morning-card-${stamp}.jpg`;
  }

  function download() {
    const blob = blobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // 주의: 이 함수 안에서 navigator.share 전에 await를 하면 안 돼요 (아이폰에서 공유창이 막힘)
  function share() {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], fileName(), { type: "image/jpeg" });
    // 휴대폰에서는 공유 창이 떠서 카카오톡/문자/페이스북을 고를 수 있어요
    if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return; // 사용자가 취소
        download();
        alert(t.shareFallback);
      });
    } else {
      download();
      alert(t.shareFallback);
    }
  }

  return (
    <main className={`page page-${locale}`}>
      <header className="top">
        <div>
          <h1>{cfg.title}</h1>
          <p className="sub">{cfg.subtitle}</p>
        </div>
        <Link className="lang" href={locale === "ko" ? "/en" : "/ko"}>
          {t.other}
        </Link>
      </header>

      <div className="grid">
        <section className="panel">
          <h2>{t.step1}</h2>
          <div className="chips" role="list" aria-label={t.quick}>
            {cfg.presets.map((p) => (
              <button key={p.label} className="chip" onClick={() => setText(p.text)}>
                {p.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={cfg.placeholder}
            rows={5}
            maxLength={300}
          />
          <p className="hint">{t.hint}</p>

          <h2>{t.step2}</h2>
          <Group label={t.font}>
            {cfg.fonts.map((f) => (
              <Opt key={f.id} on={fontId === f.id} onClick={() => setFontId(f.id)} style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight, fontSize: "1.15em" }}>
                {f.label}
              </Opt>
            ))}
          </Group>
          <Group label={t.color}>
            {cfg.textStyles.map((s) => (
              <Opt key={s.id} on={style === s.id} onClick={() => setStyle(s.id)}>
                <span className={`swatch sw-${s.id}`} aria-hidden /> {s.label}
              </Opt>
            ))}
          </Group>
          <Group label={t.pos}>
            {(["top", "center", "bottom"] as Placement[]).map((p) => (
              <Opt key={p} on={placement === p} onClick={() => setPlacement(p)}>
                {p === "top" ? t.posTop : p === "center" ? t.posCenter : t.posBottom}
              </Opt>
            ))}
          </Group>
          <Group label={t.size}>
            {cfg.sizes.map((s) => (
              <Opt key={s.id} on={size === s.id} onClick={() => setSize(s.id)}>
                {s.label}
              </Opt>
            ))}
          </Group>

          {needCode && (
            <label className="code">
              {t.code}
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="text" autoComplete="off" />
            </label>
          )}

          <button className="primary" disabled={loading} onClick={() => make(false)}>
            {loading ? t.making : t.make}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
          {hasCard && <p className="hint">{t.edit}</p>}
        </section>

        <section className="preview" ref={previewRef}>
          <div className={`frame ${cardSize}`}>
            {!hasCard && !loading && <div className="empty">{t.preview}</div>}
            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p>{t.making}</p>
              </div>
            )}
            <canvas ref={canvasRef} hidden />
            {hasCard && imgUrl && <img className="card-img" src={imgUrl} alt={text} />}
          </div>
          {demo && hasCard && <p className="demo">{t.demo}</p>}
          {hasCard && <p className="hint">{t.longPress}</p>}
          {hasCard && (
            <div className="actions">
              <button className="primary big" onClick={share}>{t.share}</button>
              <button className="secondary" onClick={download}>{t.download}</button>
              <button className="ghost" disabled={loading} onClick={() => make(true)}>{t.redraw}</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <div className="group-label">{label}</div>
      <div className="opts">{children}</div>
    </div>
  );
}

function Opt({ on, onClick, children, style }: { on: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button className={`opt ${on ? "on" : ""}`} aria-pressed={on} onClick={onClick} style={style}>
      {children}
    </button>
  );
}
