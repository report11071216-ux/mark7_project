import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "길드패스 - 로스트아크 길드 운영 플랫폼",
    template: "%s | 길드패스",
  },
  description:
    "디스코드 채널은 흘러가고, 엑셀은 복잡해요. 위젯으로 직접 꾸미는 우리 길드만의 홈페이지를 만들어보세요.",
  keywords: [
    "로스트아크",
    "길드",
    "길드 운영",
    "길드 홈페이지",
    "레이드 일정",
    "출석 체크",
    "길드 채팅",
    "길드 관리",
  ],
  authors: [{ name: "길드패스" }],
  creator: "길드패스",
  metadataBase: new URL("https://clayloa.com"),
  alternates: {
    canonical: "https://clayloa.com",
  },
  openGraph: {
    title: "길드패스 - 로스트아크 길드 운영 플랫폼",
    description:
      "위젯으로 직접 꾸미는 우리 길드만의 홈페이지. 베타 기간 무료.",
    url: "https://clayloa.com",
    siteName: "길드패스",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "길드패스 - 로스트아크 길드 운영 플랫폼",
    description:
      "위젯으로 직접 꾸미는 우리 길드만의 홈페이지. 베타 기간 무료.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className={`${jakarta.variable} min-h-screen bg-background font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(263 30% 9%)",
              color: "hsl(0 0% 98%)",
              border: "1px solid hsl(263 30% 18%)",
              borderRadius: "12px",
              fontFamily: "var(--font-pretendard)",
              fontSize: "14px",
              boxShadow: "0 8px 32px -8px hsl(263 70% 50% / 0.3)",
            },
            success: {
              iconTheme: {
                primary: "hsl(189 94% 55%)",
                secondary: "hsl(263 50% 8%)",
              },
            },
            error: {
              iconTheme: {
                primary: "hsl(0 70% 55%)",
                secondary: "hsl(0 0% 98%)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
