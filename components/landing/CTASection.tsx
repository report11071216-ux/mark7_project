import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-padding relative">
      <div className="container-padded">
        <div className="relative rounded-3xl overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-950/50 via-card to-cyan-950/30 p-12 md:p-20 text-center">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-violet-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <p className="mono-label mb-6">READY TO START</p>
            <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              지금 무료로
              <br />
              <span className="text-gradient-violet-strong">시작하세요</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              베타 기간 동안 모든 기능 무료. 신용카드 등록 없이 바로 시작할 수 있어요.
            </p>
            <Button variant="gradient" size="xl" className="min-w-[260px]">
              <Sparkles />
              무료로 길드 만들기
              <ArrowRight />
            </Button>
            <p className="text-xs text-muted-foreground mt-6 font-mono tracking-wider">
              · 베타 기간 무료 · 5분 만에 시작 · 카드 등록 불필요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
