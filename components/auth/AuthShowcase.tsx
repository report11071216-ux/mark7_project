import { Card, CardEyebrow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuroraBackground } from "@/components/landing/AuroraBackground";
import { CalendarDays, MessageCircle, TrendingUp } from "lucide-react";

const raidSchedule = [
  { name: "카멘 하드", day: "월", time: "20:00", color: "bg-violet-400" },
  { name: "에키드나", day: "수", time: "21:00", color: "bg-cyan-400" },
  { name: "발탄 노말", day: "금", time: "19:30", color: "bg-amber-400" },
];

const chatMessages = [
  { name: "쁘밍", msg: "오늘 출석 다 했어요!", time: "방금" },
  { name: "단풍", msg: "발탄 같이 가실 분~", time: "2분 전" },
  { name: "별빛", msg: "오늘 보스 클리어! 🎉", time: "5분 전" },
];

const statsData = [
  { label: "월", value: 60 },
  { label: "화", value: 80 },
  { label: "수", value: 95 },
  { label: "목", value: 70 },
  { label: "금", value: 100 },
  { label: "토", value: 85 },
  { label: "일", value: 55 },
];

export function AuthShowcase() {
  return (
    <div className="relative w-full h-full overflow-hidden hidden lg:flex flex-col justify-center px-12 xl:px-20 py-16">
      <AuroraBackground variant="subtle" />

      <div className="relative z-10 max-w-xl">
        <p className="mono-label mb-6">GUILDPASS · COMMUNITY</p>
        <h1 className="font-display text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] text-white mb-5">
          우리만의 공간,
          <br />
          <span className="text-gradient-violet-strong">우리만의 규칙.</span>
        </h1>
        <p className="text-muted-foreground text-base xl:text-lg leading-relaxed mb-10 max-w-md">
          엑셀과 디스코드에 흩어진 일정, 출석, 멤버 정보를
          <br />
          우리 길드만의 홈페이지로 모아보세요.
        </p>

        <div className="space-y-3 max-w-md">
          {/* 캘린더 미리보기 */}
          <Card variant="glass" className="p-4 animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-400" />
                <CardEyebrow>RAID CALENDAR</CardEyebrow>
              </div>
              <Badge variant="default" size="sm">3건</Badge>
            </div>
            <div className="space-y-2">
              {raidSchedule.map((raid) => (
                <div key={raid.name} className="flex items-center gap-3 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${raid.color} shadow-[0_0_8px_currentColor]`} />
                  <span className="text-white font-medium flex-1">{raid.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {raid.day} {raid.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* 채팅 미리보기 */}
          <Card variant="glass" className="p-4 animate-fade-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                <CardEyebrow>GUILD CHAT</CardEyebrow>
              </div>
              <Badge variant="online" dot size="sm">실시간</Badge>
            </div>
            <div className="space-y-2">
              {chatMessages.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-violet-300 text-xs font-bold">{m.name}</span>
                      <span className="text-muted-foreground text-[10px] font-mono">{m.time}</span>
                    </div>
                    <p className="text-foreground/80 text-xs truncate">{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 통계 미리보기 */}
          <Card variant="glass" className="p-4 animate-fade-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <CardEyebrow>WEEKLY ACTIVITY</CardEyebrow>
              </div>
              <span className="font-mono text-xs text-cyan-300 font-bold">92%</span>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {statsData.map((d, i) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-violet-600 to-violet-400"
                    style={{ height: `${d.value}%`, opacity: 0.4 + d.value / 200 }}
                  />
                  <span className="text-[9px] text-muted-foreground font-mono">{d.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
