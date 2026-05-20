import Link from "next/link";
import { Shield } from "lucide-react";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { DiscordLoginButton } from "@/components/auth/DiscordLoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.3fr_1fr]">
      {/* 좌측: 자랑 패널 (데스크탑만) */}
      <AuthShowcase />

      {/* 우측: 로그인 폼 */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 min-h-screen lg:min-h-0">
        {/* 모바일 배경 효과 */}
        <div className="absolute inset-0 lg:hidden -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full" />
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* 로고 */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
            <Shield className="w-7 h-7 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span className="font-display text-2xl font-bold text-white">
              길드패스
            </span>
          </Link>

          {/* 헤더 */}
          <div className="mb-10">
            <p className="mono-label mb-3">SIGN IN</p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
              환영합니다
            </h2>
            <p className="text-muted-foreground">
              디스코드 계정으로 빠르게 시작하세요
            </p>
          </div>

          {/* 로그인 버튼 */}
          <div className="space-y-4">
            <DiscordLoginButton />

            <p className="text-center text-xs text-muted-foreground font-mono tracking-wider">
              · 5초 가입 · 카드 등록 불필요 · 베타 무료
            </p>
          </div>

          {/* 구분선 */}
          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">
              이미 가입했나요?
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 길드 코드로 참여 */}
          <Link
            href="/login?mode=guild-code"
            className="block text-center text-sm text-violet-300 hover:text-violet-200 transition-colors"
          >
            길드 코드로 바로 참여하기 →
          </Link>

          {/* 약관 */}
          <p className="mt-12 text-center text-xs text-muted-foreground leading-relaxed">
            가입 시{" "}
            <Link href="/terms" className="text-violet-400 hover:underline">
              이용약관
            </Link>
            과{" "}
            <Link href="/privacy" className="text-violet-400 hover:underline">
              개인정보처리방침
            </Link>
            에<br />
            동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
