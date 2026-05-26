"use client";
import { useState, useEffect, useTransition } from "react";
import { checkAttendance } from "@/app/guild/[code]/attendance/actions";
import { getMsUntilNextReset, formatTimeUntilReset } from "@/lib/attendance";
import { Check, Clock } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  alreadyAttended: boolean;
  streak: number;
  totalAttendances: number;
  accent?: string;
  textPrimary?: string;
  textSecondary?: string;
  surface?: string;
};

export default function AttendanceWidget({
  guildCode,
  alreadyAttended: initialAttended,
  streak,
  totalAttendances,
  accent = "#7c3aed",
  textPrimary = "#ffffff",
  textSecondary = "#a1a1aa",
  surface = "#27272a",
}: Props) {
  const [attended, setAttended] = useState(initialAttended);
  const [isPending, startTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => setTimeLeft(formatTimeUntilReset(getMsUntilNextReset()));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCheck = () => {
    startTransition(async () => {
      const result = await checkAttendance(guildCode);
      if (result.success) {
        setAttended(true);
        toast.success(`출석 완료! +${result.points}P 획득`);
      } else {
        toast.error(result.error ?? "출석 실패");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: surface }}>
          <p className="text-[10px] mb-0.5" style={{ color: textSecondary }}>총 출석</p>
          <p className="text-sm font-bold" style={{ color: textPrimary }}>{totalAttendances}일</p>
        </div>
        <div className="flex-1 rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: surface }}>
          <p className="text-[10px] mb-0.5 flex items-center justify-center gap-0.5" style={{ color: textSecondary }}>
            <Clock className="w-2.5 h-2.5" />
            리셋
          </p>
          <p className="text-sm font-bold whitespace-nowrap" style={{ color: textPrimary }}>{timeLeft}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleCheck}
        disabled={attended || isPending}
        className="w-full h-10 rounded-lg text-sm font-bold transition-opacity flex items-center justify-center disabled:cursor-not-allowed"
        style={
          attended
            ? { backgroundColor: surface, color: textSecondary }
            : { backgroundColor: accent, color: "#ffffff", opacity: isPending ? 0.7 : 1 }
        }
      >
        {attended ? (
          <>
            <Check className="w-4 h-4 mr-1.5" />
            출석 완료
          </>
        ) : isPending ? (
          "처리 중..."
        ) : (
          "출석 체크 (+1P)"
        )}
      </button>
    </div>
  );
}
