"use client";
import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

type DrawnCard = {
  id: string;
  grade: string;
  name: string;
  imageUrl: string | null;
  isNew: boolean;
};

type Props = {
  cards: DrawnCard[] | null;
  ticketsEarned: number;
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
  epic: "rgba(220,38,38,0.85)",
};
const GRADE_ORDER: { [key: string]: number } = { common: 0, rare: 1, unique: 2, epic: 3 };

export default function CardDrawResultModal({ cards, ticketsEarned, onClose }: Props) {
  const [revealed, setRevealed] = useState<number>(0);

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    setRevealed(0);
    // 순차로 뒤집기
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= cards.length) clearInterval(interval);
    }, cards.length > 1 ? 180 : 600);
    return () => clearInterval(interval);
  }, [cards]);

  if (!cards || cards.length === 0) return null;

  const allRevealed = revealed >= cards.length;
  const isEleven = cards.length > 1;

  // 최고 등급 (헤더 강조용)
  let topGrade = "common";
  for (const c of cards) {
    if ((GRADE_ORDER[c.grade] ?? 0) > (GRADE_ORDER[topGrade] ?? 0)) topGrade = c.grade;
  }

  function handleSkip() {
    if (!allRevealed) {
      setRevealed(cards!.length); // 즉시 다 공개
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={handleSkip}
    >
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-4">
          <p className="text-sm font-bold" style={{ color: GRADE_COLOR[topGrade] }}>
            {isEleven ? "11연 뽑기 결과" : "카드 획득!"}
          </p>
          {allRevealed && ticketsEarned > 0 && (
            <p className="text-xs mt-1 px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 font-bold inline-block">
              🎟️ 중복 보너스! 뽑기권 +{ticketsEarned}
            </p>
          )}
        </div>

        {/* 카드 그리드 */}
        <div className={isEleven ? "grid grid-cols-4 gap-2" : "flex justify-center"}>
          {cards.map((card, i) => {
            const isFlipped = i < revealed;
            const color = GRADE_COLOR[card.grade] ?? "#94a3b8";
            const glow = GRADE_GLOW[card.grade] ?? "rgba(148,163,184,0.5)";
            return (
              <div
                key={`${card.id}-${i}`}
                className="relative"
                style={{
                  perspective: "600px",
                  aspectRatio: "3/4",
                  width: isEleven ? "100%" : "160px",
                }}
              >
                <div
                  className="relative w-full h-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* 뒷면 */}
                  <div
                    className="absolute inset-0 rounded-lg flex items-center justify-center"
                    style={{
                      backfaceVisibility: "hidden",
                      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Sparkles className={isEleven ? "w-5 h-5 text-white/30" : "w-10 h-10 text-white/30"} />
                  </div>
                  {/* 앞면 */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      border: `2px solid ${color}`,
                      boxShadow: isFlipped ? `0 0 16px ${glow}` : "none",
                    }}
                  >
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Sparkles className="w-6 h-6" style={{ color }} />
                      </div>
                    )}
                    {card.isNew && (
                      <span className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-cyan-500 text-white text-[8px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 단일 뽑기 이름 표시 */}
        {!isEleven && allRevealed && (
          <div className="text-center mt-4">
            <p className="text-lg font-bold text-white">{cards[0].name}</p>
            <p className="text-sm" style={{ color: GRADE_COLOR[cards[0].grade] }}>
              {GRADE_LABEL[cards[0].grade]} {cards[0].isNew ? "· 새 카드!" : "· 중복"}
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={handleSkip}
            className="px-8 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
          >
            {allRevealed ? "확인" : "건너뛰기"}
          </button>
        </div>
      </div>
    </div>
  );
}
