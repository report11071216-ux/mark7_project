"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };
    const node = ref.current;
    if (node) {
      node.addEventListener("mousemove", handleMouseMove);
      return () => node.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32"
    >
      <AuroraBackground />

      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, hsl(263 80% 65% / 0.15), transparent 40%)`,
        }}
      />

      <div className="container-padded relative z-10 text-center">
        <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
          <Badge variant="online" dot>
            BETA · GUILD PLATFORM
          </Badge>
        </div>

        {/* 메인 제목: 사이즈 다운, 웨이트 다운, leading 여유 */}
        <h1 className="font-sans text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] mb-6 animate-fade-up">
          <span className="block text-white">길드 운영,</span>
          <span className="block text-gradient-violet-strong">한 곳에서.</span>
        </h1>

        <p
          className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed mb-12 animate-fade-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          디스코드 채널은 흘러가고, 엑셀은 복잡해요.
          <br className="hidden md:block" />
          위젯으로 직접 꾸미는 우리 길드만의 홈페이지를 만들어보세요.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          <Button variant="gradient" size="xl" className="min-w-[220px]" asChild>
            <Link href="/login">
              무료로 길드 만들기
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" size="xl" className="min-w-[220px]" asChild>
            <Link href="/login?mode=guild-code">
              <Shield />
              길드 코드로 참여
            </Link>
          </Button>
        </div>

        {/* 하단 통계: 숫자는 mono 유지(의도된 디자인), 라벨도 mono 유지 */}
        <div
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-up"
          style={{ animationDelay: "0.6s", opacity: 0 }}
        >
          <div className="text-center">
            <div className="font-mono text-3xl md:text-4xl font-bold text-violet-300">
              12+
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
              위젯 종류
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl md:text-4xl font-bold text-cyan-300">
              ∞
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
              커스텀 가능
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl md:text-4xl font-bold text-violet-300">
              24/7
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
              언제든 접속
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
