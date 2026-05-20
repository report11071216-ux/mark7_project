import {
  Card,
  CardEyebrow,
  CardDescription,
} from "@/components/ui/card";
import {
  CalendarDays,
  MessageCircle,
  BarChart3,
  Trophy,
  Users,
} from "lucide-react";

export function Features() {
  return (
    <section className="section-padding relative">
      <div className="container-padded">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="mono-label mb-3">FEATURES · 핵심 기능</p>
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            길드에 필요한 모든 것
          </h2>
          <p className="text-lg text-muted-foreground">
            출석부터 레이드 모집, 통계까지. 위젯을 자유롭게 조합하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 큰 카드 - 위젯 빌더 (핵심) */}
          <Card variant="gradient" hover className="md:col-span-2 md:row-span-2 p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full" />
            <div className="relative z-10">
              <CardEyebrow className="text-cyan-300">FLAGSHIP</CardEyebrow>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
                위젯 빌더
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-md mb-6">
                드래그앤드롭으로 우리 길드만의 홈페이지를 만들어보세요. 캘린더, 채팅, 통계 등 12종 위젯을 원하는 위치에 배치할 수 있어요.
              </p>
              <div className="grid grid-cols-4 gap-2 mt-8 max-w-xs">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/30 group-hover:border-violet-400/60 group-hover:shadow-[0_0_12px_hsl(263_80%_65%_/_0.4)] transition-all"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card variant="glass" hover className="p-6">
            <CalendarDays className="w-8 h-8 text-violet-400 mb-4" />
            <CardEyebrow>CALENDAR</CardEyebrow>
            <h3 className="font-display text-xl font-bold text-white mt-2 mb-2">
              레이드 캘린더
            </h3>
            <CardDescription>일정 등록과 파티 모집을 한번에</CardDescription>
          </Card>

          <Card variant="glass" hover className="p-6">
            <MessageCircle className="w-8 h-8 text-cyan-400 mb-4" />
            <CardEyebrow>CHAT</CardEyebrow>
            <h3 className="font-display text-xl font-bold text-white mt-2 mb-2">
              실시간 길드 채팅
            </h3>
            <CardDescription>이모지, 멘션, 알림 지원</CardDescription>
          </Card>

          <Card variant="glass" hover className="p-6">
            <Trophy className="w-8 h-8 text-amber-400 mb-4" />
            <CardEyebrow>ATTENDANCE</CardEyebrow>
            <h3 className="font-display text-xl font-bold text-white mt-2 mb-2">
              출석 시스템
            </h3>
            <CardDescription>매일 출석 보상으로 활성도 향상</CardDescription>
          </Card>

          <Card variant="glass" hover className="p-6">
            <BarChart3 className="w-8 h-8 text-violet-400 mb-4" />
            <CardEyebrow>ANALYTICS</CardEyebrow>
            <h3 className="font-display text-xl font-bold text-white mt-2 mb-2">
              활동 히트맵
            </h3>
            <CardDescription>한눈에 보는 길드 활성도</CardDescription>
          </Card>

          <Card variant="glass" hover className="p-6">
            <Users className="w-8 h-8 text-cyan-400 mb-4" />
            <CardEyebrow>MEMBERS</CardEyebrow>
            <h3 className="font-display text-xl font-bold text-white mt-2 mb-2">
              멤버 관리
            </h3>
            <CardDescription>역할, 프로필, 칭호 시스템</CardDescription>
          </Card>
        </div>
      </div>
    </section>
  );
}
