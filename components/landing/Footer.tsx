import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm relative z-10">
      <div className="container-padded py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-violet-400" />
              <span className="font-display text-xl font-bold text-white">
                길드패스
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              로스트아크 길드를 위한 올인원 운영 플랫폼.
              우리 길드만의 홈페이지를 만들어보세요.
            </p>
          </div>

          <div>
            <h4 className="mono-label mb-4">PRODUCT</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  기능
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  요금제
                </Link>
              </li>
              <li>
                <Link href="/widgets" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  위젯 갤러리
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mono-label mb-4">COMPANY</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  문의
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-muted-foreground hover:text-violet-300 transition-colors">
                  업데이트
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>© 2026 길드패스. All rights reserved.</p>
            <p className="font-mono opacity-60">
              사업자 정보 · 통신판매업신고 · 추후 등록 예정
            </p>
          </div>
          <div className="flex gap-6 text-xs">
            <Link href="/terms" className="text-muted-foreground hover:text-violet-300 transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-violet-300 transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/refund" className="text-muted-foreground hover:text-violet-300 transition-colors">
              환불정책
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
