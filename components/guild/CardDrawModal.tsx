"use client";
import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

type DrawnCard = {
  id: string;
  grade: string;
  name: string;
  imageUrl: string | null;
  isNew: boolean;
  ticketEarned: boolean;
};

type Props = {
  card: DrawnCard | null;
  onClose: () => void;
};

const GRADE_LABEL: { [key: string]: string } = {
  common: "커먼", rare: "레어", unique: "유니크", epic: "에픽",
};
const GRADE_COLOR: { [key: string]: string } = {
  common: "#94a3b8", rare: "#2563eb", unique: "#7c3aed", epic: "#dc2626",
};
const GRADE_GLOW: { [key: string]: string } = {
  common: "rgba(148,163,184,0.5)",
  rare: "rgba(37,99,235,0.6)",
  unique: "rgba(124,58,237,0.7)",
  epic: "rgba(220,38,38,0.8)",
};

export default function CardDrawModal({ card, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);

  // 카드 바뀌면 뒷면부터 시작
  useEffect(() => {
    if (card) {
      setFlipped(false);
      // 잠깐 뒤 자동으로 뒤집기 (두근거림 연출)
      const t = setTimeout(() => setFlipped(true), 700);
      return () => clearTimeout(t);
    }
  }, [card]);

  if (!card) return null;

  const color = GRADE_COLOR[card.grade] ?? "#94a3b8";
  const glow = GRADE_GLOW[card.grade] ?? "rgba(148,163,184,0.5)";
  const isEpic = card.grade === "epic";
  const isUnique = card.grade === "unique";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 등급 라벨 */}
        <div
          className="mb-4 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-500"
          style={{
            backgroundColor: flipped ? color : "transparent",
            color: flipped ? "#fff" : "transparent",
            opacity: flipped ? 1 : 0,
            boxShadow: flipped ? `0 0 24px ${glow}` : "none",
          }}
        >
          {GRADE_LABEL[card.grade] ?? card.grade} 카드
        </div>

        {/* 카드 (뒤집기) */}
        <div
          className="relative"
          style={{ perspective: "1000px", width: "200px", height: "267px" }}
        >
          {/* 빛 오라 */}
          {flipped && (
            <div
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                boxShadow: `0 0 60px 12px ${glow}`,
                animation: isEpic ? "pulse 1.2s ease-in-out infinite" : undefined,
              }}
            />
          )}

          <div
            className="relative w-full h-full transition-transform duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* 뒷면 */}
            <div
              className="absolute inset-0 rounded-2xl flex items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            >
              <Sparkles className="w-12 h-12 text-white/30" />
            </div>

            {/* 앞면 */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                border: `3px solid ${color}`,
                boxShadow: `0 0 30px ${glow}`,
              }}
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Sparkles className="w-12 h-12" style={{ color }} />
                </div>
              )}
              {/* NEW 뱃지 */}
              {card.isNew && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[11px] font-bold shadow-lg">
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 카드 이름 + 정보 */}
        <div
          className="mt-5 text-center transition-all duration-500"
          style={{ opacity: flipped ? 1 : 0, transform: flipped ? "translateY(0)" : "translateY(8px)" }}
        >
          <p className="text-lg font-bold text-white">{card.name}</p>
          <p className="text-sm mt-1" style={{ color }}>
            {card.isNew ? "✨ 새로운 카드를 획득했어요!" : "이미 보유한 카드 (중복)"}
          </p>
          {card.ticketEarned && (
            <p className="text-sm mt-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 font-bold inline-block">
              🎟️ 중복 5장 달성! 뽑기권 +1
            </p>
          )}
        </div>

        {/* 확인 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 px-8 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
          style={{ opacity: flipped ? 1 : 0 }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
