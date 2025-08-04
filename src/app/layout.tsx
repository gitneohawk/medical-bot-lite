import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 👈 この行でCSSをインポート

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI健康相談",
  description: "AIによる健康相談チャット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}