import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "인사 카드 만들기 · Greeting Card Maker",
  description: "인사말을 쓰면 AI가 정겨운 그림을 그려 카드로 만들어 드려요. Type a greeting, get a classic good-morning card.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff7ee" };

// 카드 글씨용 폰트 (한글 + 영어 필기체). 캔버스에서도 이 폰트들을 써요.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gaegu:wght@700&family=Jua&family=Nanum+Pen+Script&family=Great+Vibes&family=Dancing+Script:wght@700&family=Lobster&family=Pinyon+Script&family=Gowun+Dodum&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
