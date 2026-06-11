import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "광장",
  description:
    "길드패스 광장 - 길드 랭킹, 게시판, 커뮤니티. 회원가입 없이 둘러볼 수 있어요.",
};
export default function PlazaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="plaza-dark min-h-screen bg-plaza-canvas text-plaza-ink">
      {children}
    </div>
  );
}
