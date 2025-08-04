import "../tailwind.css"; // 👈 TailwindのCSSを最初に読み込む
import "../globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
