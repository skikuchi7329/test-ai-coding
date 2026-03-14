import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "パチスロ専業ローグライク",
  description: "パチスロ専業（期待値稼働）シミュレーションローグライクゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
