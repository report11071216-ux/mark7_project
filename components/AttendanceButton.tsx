"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Props = {
  guildId: string;
  userId: string;
  alreadyCheckedIn: boolean;
  myPoints: number;
};

// KST 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getKstToday(): string {
  const now = new Date();
  const kstOffsetMs = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffsetMs);
  return kstNow.toISOString().split("T")[0];
}

export default function AttendanceButton({
  guildId,
  userId,
  alreadyCheckedIn,
  myPoints,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyCheckedIn);

  const handleCheckIn = async () => {
    if (done || loading) return;
    setLoading(true);

    const supabase = createClient();
    const today = getKstToday();

    const { error } = await supabase.from("attendances").insert({
      guild_id: guildId,
      user_id: userId,
      attendance_date: today,
      points_earned: 1,
    });

    setLoading(false);

    if (error) {
      // UNIQUE 제약 위반 = 이미 출석함
      if (error.code === "23505") {
        toast.error("오늘은 이미 출석하셨어요!");
        setDone(true);
        router.refresh();
        return;
      }
      toast.error("출석체크에 실패했어요. 잠시 후 다시 시도해주세요.");
      console.error("Attendance error:", error);
      return;
    }

    toast.success("출석 완료! +1P 적립 ⭐");
    setDone(true);
    router.refresh(); // 멤버 포인트, 길드 총합 새로고침
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-3 text-xl font-bold text-gray-900">📅 오늘 출석</h2>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-600">내 포인트</span>
        <span className="text-lg font-bold text-blue-600">
          {myPoints.toLocaleString()}P
        </span>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={done || loading}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
          done
            ? "cursor-not-allowed bg-gray-300"
            : loading
              ? "cursor-wait bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {done
          ? "✅ 오늘 출석 완료"
          : loading
            ? "처리 중..."
            : "✋ 출석체크 (+1P)"}
      </button>

      <p className="mt-2 text-center text-xs text-gray-500">
        하루 1회 출석 시 길드 포인트 +1
      </p>
    </div>
  );
}
