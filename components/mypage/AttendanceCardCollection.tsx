"use client";
import { useState } from "react";
import { Sparkles, Check, Loader2, Lock, Ticket } from "lucide-react";
import { equipAttendanceCard, drawWithTicket } from "@/app/mypage/card-actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type CardDef = {
  grade: string;
  name: string;
  bonus_points: number;
  nickname_color: string | null;
  image_url: string | null;
  owned: boolean;
  count: number;
};

type Props = {
  cards: CardDef[];          // 4등급 정의 + 보유여부
  equippedGrade: string | null;
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

export default function AttendanceCardCollection({ cards, equippedGrade, drawTickets, totalDuplicates }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  // 다음 뽑기권까지 남은 중복
  const towardNext = totalDuplicates % 5;

  async function handleEquip(grade: string, isEquipped: boolean) {
    if (pending) return;
    setPending(grade);
    const result = await equipAttendanceCard(isEquipped ? null : grade);
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
      const gradeName = cards.find((c) => c.grade === result.card!.grade)?.name ?? result.card.grade;
      if (result.card.isNew) {
        toast.success(`✨ 새 카드 [${gradeName}] 획득!`);
      } else {
        toast.success(`[${gradeName}] 카드 (중복)`);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
            Attendance Cards
          </p>
        </div>
        {/* 뽑기권 */}
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

      {/* 중복 진행도 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>다음 뽑기권까지</span>
          <span className="font-mono">{towardNext}/5</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-violet-400 transition-all"
            style={{ width: `${(towardNext / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 도감 4칸 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => {
          const isEquipped = equippedGrade === card.grade;
          return (
            <div
              key={card.grade}
              className={
                "relative rounded-xl border-2 overflow-hidden transition " +
                (isEquipped ? "border-cyan-400" : card.owned ? "border-slate-200" : "border-dashed border-slate-200")
              }
            >
              {/* 카드 이미지 영역 */}
              <div className={"aspect-[3/4] flex items-center justify-center bg-gradient-to-b " + (card.owned ? GRADE_GLOW[card.grade] : "from-slate-50 to-slate-100")}>
                {card.owned ? (
                  card.image_url ? (
                    <img src={card.image_url} alt={card.name} className={"w-full h-full object-cover ring-2 " + GRADE_RING[card.grade]} />
                  ) : (
                    <div className={"w-full h-full flex flex-col items-center justify-center"}>
                      <Sparkles className="w-7 h-7 mb-1" style={{ color: card.nickname_color ?? "#6b7280" }} />
                      <span className="text-xs font-bold" style={{ color: card.nickname_color ?? "#374151" }}>{card.name}</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Lock className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">미보유</span>
                  </div>
                )}
                {/* 보유 수 뱃지 */}
                {card.owned && card.count > 1 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-slate-900/70 text-white text-[9px] font-bold">
                    ×{card.count}
                  </span>
                )}
                {isEquipped && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />장착
                  </span>
                )}
              </div>

              {/* 정보 + 버튼 */}
              <div className="p-2 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold" style={{ color: card.nickname_color ?? "#374151" }}>{card.name}</span>
                  <span className="text-[10px] font-bold text-violet-600">+{card.bonus_points}P</span>
                </div>
                {card.owned ? (
                  <button
                    type="button"
                    onClick={() => handleEquip(card.grade, isEquipped)}
                    disabled={pending === card.grade}
                    className={
                      "w-full h-7 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 " +
                      (isEquipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                    }
                  >
                    {pending === card.grade ? <Loader2 className="w-3 h-3 animate-spin" /> : isEquipped ? "해제" : "장착"}
                  </button>
                ) : (
                  <div className="w-full h-7 rounded-lg bg-slate-50 text-slate-300 text-[11px] font-bold flex items-center justify-center">
                    미보유
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-3 text-center">
        출석하면 매일 카드를 1장 뽑아요 · 장착한 카드 등급만큼 출석 포인트가 추가됩니다
      </p>
    </div>
  );
}
