// components/guild/AttendanceWidget.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkAttendance } from "@/app/guild/[code]/attendance/actions";
import { getMsUntilNextReset, formatTimeUntilReset } from "@/lib/attendance";
import { Flame, Check, Clock } from "lucide-react";
import { toast } from "sonner";

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

  // 리셋까지 남은 시간 업데이트 (1분마다)
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
    <Card className="p-6 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            DAILY ATTENDANCE
          </p>
          <h3 className="text-lg font-bold text-white">오늘의 출석</h3>
        </div>
        <Badge variant="outline" className="border-violet-500/30 text-violet-300">
          <Flame className="w-3 h-3 mr-1" />
          {streak}일 연속
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1">총 출석</p>
          <p className="text-xl font-bold text-white">{totalAttendances}일</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            리셋까지
          </p>
          <p className="text-xl font-bold text-cyan-300">{timeLeft}</p>
        </div>
      </div>
      <Button
        onClick={handleCheck}
        disabled={attended || isPending}
        className={`w-full h-12 font-bold transition-all ${
          attended
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/20"
        }`}
      >
        {attended ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            오늘 출석 완료
          </>
        ) : isPending ? (
          "처리 중..."
        ) : (
          "출석 체크 (+1P)"
        )}
      </Button>
    </Card>
  );
}
