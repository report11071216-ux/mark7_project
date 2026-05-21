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
  recruit: { color: "text-cyan-600", emoji: "📢" },
  birthday: { color: "text-pink-600", emoji: "🎂" },
  win: { color: "text-amber-600", emoji: "🏆" },
  event: { color: "text-blue-600", emoji: "✨" },
};

export default function MegaphoneTicker() {
  const items = [...PLACEHOLDER_MESSAGES, ...PLACEHOLDER_MESSAGES];
  return (
    <div className="relative border-y border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50/50 to-white overflow-hidden">
      {/* 좌측 라벨 */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4 bg-blue-600 border-r border-blue-500">
        <Megaphone className="w-3.5 h-3.5 text-white" />
        <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">
          LIVE
        </span>
      </div>
      {/* 우측 페이드 */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      {/* 마퀴 콘텐츠 */}
      <div className="py-2.5 pl-24 pr-4 overflow-hidden">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {items.map((item, i) => {
            const style = TYPE_STYLE[item.type];
            return (
              <span key={i} className="text-xs flex items-center gap-2 shrink-0">
                <span>{style.emoji}</span>
                <span className="font-bold text-slate-700">[{item.guild}]</span>
                <span className={style.color}>{item.text}</span>
                <span className="text-slate-300 ml-4">•</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
