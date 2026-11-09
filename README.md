# Greeting Card Maker (효도 카드 만들기)

Type a greeting, get a nostalgic "good morning" card — the kind grandparents share on KakaoTalk, WhatsApp and Facebook every morning. An image model paints a kitschy, glittery background that matches the meaning of your text; the lettering is drawn on top in the browser. Save it as a JPG or share it straight to a messenger from your phone.

Two editions with different sensibilities:

| | Korean (`/ko`) | English (`/en`) |
|---|---|---|
| Look | Tall KakaoTalk format, bold rounded/handwritten Hangul with thick outlines, multicolor lines | Square format, cursive script, purple glitter / gold / chrome lettering, glitter frame |
| Imagery | Yellow tulips, red roses, peonies, peaches & apples, sparkling hearts, blue skies | Purple orchids, butterflies, coffee with latte art, doves, roses, lakeside scenes |
| Quick phrases | Weekday greetings, health, gratitude & prayer, love, holidays | Good Morning / God Bless, Have a Nice Day, Blessed Sunday, Good Night |

`/` redirects to `/ko` or `/en` based on the browser's language.

## How it works

1. **Analyze** — a cheap text model reads the greeting and picks the scene, where the lettering goes, and a matching text color. If that call fails, a keyword table (weekdays, seasons, health, faith, coffee, love…) takes over.
2. **Paint** — the image model draws a **text-free background** only. Image models still misspell Hangul (and sometimes English), so they never draw letters here.
3. **Letter** — the browser composites the text, sparkles and frame on a `<canvas>` with Google Fonts. Editing the text, font, color or position re-renders instantly without paying for a new image.
4. **Save / share** — JPG download, or the Web Share API on phones (pick KakaoTalk from the share sheet).

Without an API key the site runs in **demo mode** with a simple generated background, so you can try the UI first.

## Tech

- Next.js (App Router) + TypeScript, no other runtime dependencies
- One API route: `POST /api/generate`
- OpenAI Images API (`gpt-image-1.5` by default) + a small chat model for analysis
- Deploys to Vercel as-is

## Run locally

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY (leave empty for demo mode)
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. On Vercel: **Add New → Project → Import** this repo (framework auto-detects as Next.js).
3. Add environment variables (below), then **Deploy**.
4. After changing variables later, **Redeploy** for them to take effect.

## Environment variables

| Name | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Required for AI images. Empty = demo mode. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1.5` | `gpt-image-1-mini` costs roughly a third. |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low` / `medium` / `high` |
| `OPENAI_TEXT_MODEL` | `gpt-5-mini` | Model used to analyze the greeting. |
| `ACCESS_CODE` | — | If set, users must enter this code to generate (remembered per device). Strongly recommended for public links. |
| `DAILY_LIMIT_PER_IP` | `20` | Best-effort per-IP daily cap (in-memory, not exact across instances). |

## Cost

Only image generation costs money; re-styling text is free. Approximate per-image prices ([source](https://pricepertoken.com/gpt-image-pricing), check OpenAI's pricing page for current rates):

| Model · quality | Square (1024×1024) | Tall (1024×1536) |
|---|---|---|
| gpt-image-1.5 · medium | ~$0.034 | ~$0.051 |
| gpt-image-1.5 · low | ~$0.009 | ~$0.014 |
| gpt-image-1-mini · medium | ~$0.011 | ~$0.017 |

Use prepaid OpenAI credits with auto-recharge off and a monthly usage limit to cap spending. Note that Vercel's free Hobby plan is for non-commercial use only.

## Project structure

| Path | What's inside |
|---|---|
| `lib/locales.ts` | Everything edition-specific: copy, quick phrases, fonts, text styles, image aesthetic |
| `lib/analyze.ts` | Greeting → scene/placement/style (AI + keyword fallback) |
| `lib/generate.ts` | Prompt building and the image API call — swap providers here |
| `lib/render.ts` | Canvas compositing: lettering styles, sparkles, glitter frame, demo background |
| `components/CardMaker.tsx` | The UI |
| `app/api/generate/route.ts` | API route, access code, rate limit |
| `app/globals.css` | Styles (large type and touch targets for older users) |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Always demo mode | Check `OPENAI_API_KEY` spelling, then Redeploy |
| `403` / organization must be verified | Verify your organization in OpenAI settings |
| `429` / `insufficient_quota` | Add credits or raise your usage limit |
| `model_not_found` | Set `OPENAI_IMAGE_MODEL` to a current model name |
| `504` timeout | Use `low` quality or raise `maxDuration` in `app/api/generate/route.ts` |
| Share button only downloads | In-app browsers (e.g. inside KakaoTalk) may not support file sharing — open in Chrome/Safari |

## Roadmap ideas

- Kakao SDK link sharing (needs image hosting such as Vercel Blob)
- Stickers (hearts, butterflies, flowers) and heavier text effects
- Persistent rate limiting with Upstash/Vercel KV
- Animated sparkle GIF export

## License

MIT
