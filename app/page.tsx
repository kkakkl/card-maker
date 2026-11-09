import { headers } from "next/headers";
import { redirect } from "next/navigation";

// 첫 화면: 브라우저 언어가 한국어면 /ko, 아니면 /en 으로
export default async function Home() {
  const lang = (await headers()).get("accept-language") || "";
  redirect(lang.toLowerCase().startsWith("ko") ? "/ko" : "/en");
}
