"use client";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { checkAttendance } from "@/app/guild/[code]/attendance/actions";
import { getMsUntilNextReset, formatTimeUntilReset } from "@/lib/attendance";
import { Check, Clock } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  alreadyAttended: boolean;
  streak: number;
  totalAttendances: number;
};

export default function AttendanceWidget({
  guildCode,
  alreadyAttended: initialAttended,
  streak,
  totalAttendances,
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
        <div className="flex-1 rounded-lg bg-zinc-800/40 px-2.5 py-2 text-center">
          <p className="text-[10px] text-zinc-500 mb-0.5">총 출석</p>
          <p className="text-sm font-bold text-white">{totalAttendances}일</p>
        </div>
        <div className="flex-1 rounded-lg bg-zinc-800/40 px-2.5 py-2 text-center">
          <p className="text-[10px] text-zinc-500 mb-0.5 flex items-center justify-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            리셋
          </p>
          <p className="text-sm font-bold text-cyan-300 whitespace-nowrap">{timeLeft}</p>
        </div>
      </div>

      <Button
        onClick={handleCheck}
        disabled={attended || isPending}
        className={`w-full h-10 text-sm font-bold transition-all ${
          attended
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white"
        }`}
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
      </Button>
    </div>
  );
}
