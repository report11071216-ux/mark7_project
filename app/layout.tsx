import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "클레이 플랫폼",
  description: "길드를 위한 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
