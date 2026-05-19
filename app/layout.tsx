import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "길드패스 - 로스트아크 길드 플랫폼",
  description: "당신만의 길드, 당신만의 공간. 로스트아크 길드들이 만나는 곳.",
  openGraph: {
    title: "길드패스",
    description: "로스트아크 길드를 위한 올인원 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
