// components/plaza/MegaphoneTicker.tsx
"use client";

import { Megaphone } from "lucide-react";

// 12단계에서 실제 활성 확성기 데이터로 교체 예정
const PLACEHOLDER_MESSAGES = [
  { type: "recruit", guild: "라이트브링어", text: "신규 길드원 모집중! 카멘 노말 트라이팟" },
  { type: "birthday", guild: "밤하늘", text: "길드원 별빛님의 생일을 축하합니다 🎂" },
  { type: "win", guild: "천상계", text: "이번 주 랭킹 1위 달성! 12시간 우승 효과" },
  { type: "event", guild: "달빛여행자", text: "내일 저녁 8시 길드 이벤트 진행" },
];

const TYPE_STYLE: Record<string, { color: string; emoji: string }> = {
  recruit: { color: "text-cyan-300", emoji: "📢" },
  birthday: { color: "text-pink-300", emoji: "🎂" },
  win: { color: "text-yellow-300", emoji: "🏆" },
  event: { color: "text-violet-300", emoji: "✨" },
};

export default function MegaphoneTicker() {
  // 마퀴 효과를 위해 두 번 반복
  const items = [...PLACEHOLDER_MESSAGES, ...PLACEHOLDER_MESSAGES];

  return (
    <div className="relative border-y border-zinc-800/80 bg-gradient-to-r from-violet-950/30 via-zinc-900/30 to-cyan-950/30 overflow-hidden">
      {/* 좌측 라벨 */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4 bg-zinc-950 border-r border-zinc-800/80">
        <Megaphone className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[10px] font-mono text-violet-300 uppercase tracking-[0.2em] font-bold">
          LIVE
        </span>
      </div>
      {/* 우측 페이드 */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
      {/* 마퀴 콘텐츠 */}
      <div className="py-2.5 pl-24 pr-4 overflow-hidden">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {items.map((item, i) => {
            const style = TYPE_STYLE[item.type];
            return (
              <span key={i} className="text-xs flex items-center gap-2 shrink-0">
                <span>{style.emoji}</span>
                <span className="font-bold text-zinc-300">[{item.guild}]</span>
                <span className={style.color}>{item.text}</span>
                <span className="text-zinc-700 ml-4">•</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
