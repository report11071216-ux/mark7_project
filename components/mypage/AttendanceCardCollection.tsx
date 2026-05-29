"use client";
import { useState } from "react";
import { Sparkles, Check, Loader2, Lock, Ticket } from "lucide-react";
import { equipAttendanceCard, drawWithTicket } from "@/app/mypage/card-actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type CardItem = {
  id: string;
  grade: string;
  name: string;
  image_url: string | null;
  owned: boolean;
  count: number;
};

type GradeMeta = {
  grade: string;
  label: string;
  bonus_points: number;
  nickname_color: string | null;
};

type Props = {
  cards: CardItem[];          // 전체 활성 카드 (보유여부 포함)
  grades: GradeMeta[];        // 등급 4종 메타
  equippedCardId: string | null;
  drawTickets: number;
  totalDuplicates: number;
};

const GRADE_RING: { [key: string]: string } = {
  common: "ring-slate-300",
  rare: "ring-blue-400",
  unique: "ring-violet-500",
  epic: "ring-red-500",
};
const GRADE_GLOW: { [key: string]: string } = {
  common: "from-slate-100 to-white",
  rare: "from-blue-50 to-white",
  unique: "from-violet-50 to-white",
  epic: "from-red-50 to-white",
};
const GRADE_TAB_ACTIVE: { [key: string]: string } = {
  common: "bg-slate-200 text-slate-700",
  rare: "bg-blue-100 text-blue-700",
  unique: "bg-violet-100 text-violet-700",
  epic: "bg-red-100 text-red-700",
};

export default function AttendanceCardCollection({
  cards, grades, equippedCardId, drawTickets, totalDuplicates,
}: Props) {
  const router = useRouter();
  const [activeGrade, setActiveGrade] = useState("common");
  const [pending, setPending] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  const towardNext = totalDuplicates % 5;

  const equippedCard = cards.find((c) => c.id === equippedCardId) ?? null;
  const equippedGradeMeta = equippedCard
    ? grades.find((g) => g.grade === equippedCard.grade)
    : null;

  const gradeMetaMap: { [key: string]: GradeMeta } = {};
  for (const g of grades) gradeMetaMap[g.grade] = g;

  // 현재 탭 카드들
  const tabCards = cards.filter((c) => c.grade === activeGrade);
  const tabOwned = tabCards.filter((c) => c.owned).length;

  async function handleEquip(cardId: string, isEquipped: boolean) {
    if (pending) return;
    setPending(cardId);
    const result = await equipAttendanceCard(isEquipped ? null : cardId);
    setPending(null);
    if (result.success) {
      toast.success(isEquipped ? "장착 해제됨" : "장착 완료! 내일 출석부터 적용돼요");
      router.refresh();
    } else {
      toast.error(result.error ?? "실패했어요");
    }
  }

  async function handleDraw() {
    if (drawing || drawTickets < 1) return;
    setDrawing(true);
    const result = await drawWithTicket();
    setDrawing(false);
    if (result.success && result.card) {
      if (result.card.isNew) {
        toast.success(`✨ 새 카드 [${result.card.name}] 획득!`);
      } else {
        toast.success(`[${result.card.name}] (중복)`);
      }
      if (result.card.ticketEarned) {
        toast.success("🎟️ 중복 5장 달성! 뽑기권 +1");
      }
      router.refresh();
    } else {
      toast.error(result.error ?? "뽑기 실패");
    }
  }

  return (
    <div className="plaza-card p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
            Attendance Cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">
            <Ticket className="w-3.5 h-3.5" />
            뽑기권 {drawTickets}
          </span>
          {drawTickets > 0 && (
            <button
              type="button"
              onClick={handleDraw}
              disabled={drawing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition disabled:opacity-50"
            >
              {drawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              뽑기
            </button>
          )}
        </div>
      </div>

      {/* 장착 중인 카드 */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
        {equippedCard ? (
          <>
            <div className={"w-12 h-16 rounded-lg overflow-hidden ring-2 shrink-0 " + (GRADE_RING[equippedCard.grade] ?? "ring-slate-200")}>
              {equippedCard.image_url ? (
                <img src={equippedCard.image_url} alt={equippedCard.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-slate-400 uppercase">장착 중</p>
              <p className="text-sm font-bold truncate" style={{ color: equippedGradeMeta?.nickname_color ?? "#0f172a" }}>
                {equippedCard.name}
              </p>
              <p className="text-xs text-violet-600 font-bold">
                출석 시 +{equippedGradeMeta?.bonus_points ?? 0}P
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">장착한 카드가 없어요. 카드를 장착하면 출석 포인트가 늘어요!</p>
        )}
      </div>

      {/* 중복 진행도 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>다음 뽑기권까지 (중복 5장)</span>
          <span className="font-mono">{towardNext}/5</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-violet-400 transition-all" style={{ width: `${(towardNext / 5) * 100}%` }} />
        </div>
      </div>

      {/* 등급 탭 */}
      <div className="flex gap-1.5 mb-3">
        {grades.map((g) => {
          const active = activeGrade === g.grade;
          return (
            <button
              key={g.grade}
              type="button"
              onClick={() => setActiveGrade(g.grade)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-bold transition " +
                (active ? (GRADE_TAB_ACTIVE[g.grade] ?? "bg-slate-200 text-slate-700") : "text-slate-400 hover:bg-slate-50")
              }
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* 수집 진행도 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">
          {gradeMetaMap[activeGrade]?.label} 수집{" "}
          <span className="font-mono font-bold text-slate-700">{tabOwned}/{tabCards.length}</span>
        </p>
        <span className="text-[11px] text-violet-600 font-bold">
          장착 시 +{gradeMetaMap[activeGrade]?.bonus_points ?? 0}P
        </span>
      </div>

      {/* 카드 그리드 */}
      {tabCards.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">아직 이 등급 카드가 없어요</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {tabCards.map((card) => {
            const isEquipped = equippedCardId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => card.owned && handleEquip(card.id, isEquipped)}
                disabled={!card.owned || pending === card.id}
                className={
                  "relative rounded-xl overflow-hidden border-2 transition text-left " +
                  (isEquipped ? "border-cyan-400" : card.owned ? "border-slate-200 hover:border-violet-300 cursor-pointer" : "border-dashed border-slate-200 cursor-default")
                }
              >
                <div className={"aspect-[3/4] flex items-center justify-center bg-gradient-to-b " + (card.owned ? (GRADE_GLOW[card.grade] ?? "from-slate-100 to-white") : "from-slate-50 to-slate-100")}>
                  {card.owned ? (
                    card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-slate-300" />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-slate-300" />
                  )}

                  {card.owned && card.count > 1 && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-slate-900/70 text-white text-[9px] font-bold">
                      ×{card.count}
                    </span>
                  )}
                  {isEquipped && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {pending === card.id && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1 bg-white">
                  <p className="text-[10px] font-bold text-slate-700 truncate">
                    {card.owned ? card.name : "???"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-3 text-center">
        출석하면 매일 카드를 1장 뽑아요 · 카드를 눌러서 장착하면 등급만큼 출석 포인트가 추가됩니다
      </p>
    </div>
  );
}
