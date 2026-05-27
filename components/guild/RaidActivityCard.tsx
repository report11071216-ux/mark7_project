"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

type Stat = {
  scheduleCount: number;
  memberCount: number;
  participantCount: number;
  rate: number;
  myCount: number;
};

type Colors = {
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  dividerColor: string;
  primaryColor: string;
};

type Props = {
  week: Stat;
  month: Stat;
  colors: Colors;
};

export default function RaidActivityCard({ week, month, colors }: Props) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const s = period === "week" ? week : month;
  const { textPrimary, textSecondary, cardBg, cardBorder, dividerColor, primaryColor } = colors;

  const R = 32;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - s.rate / 100);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: primaryColor }} />
          <h2 className="text-sm font-bold" style={{ color: textPrimary }}>레이드 활동</h2>
        </div>
        <div className="flex gap-1">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="px-2 py-0.5 rounded text-[11px] font-bold transition-colors"
              style={
                period === p
                  ? { backgroundColor: primaryColor, color: "#ffffff" }
                  : { backgroundColor: dividerColor, color: textSecondary }
              }
            >
              {p === "week" ? "이번 주" : "이번 달"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {s.scheduleCount === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: textSecondary }}>
            {period === "week" ? "이번 주" : "이번 달"} 레이드 일정이 없어요
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={R} fill="none" stroke={dividerColor} strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r={R}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: textPrimary }}>
                    {s.rate}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: textPrimary }}>
                  길드 참여율
                </p>
                <p className="text-[11px]" style={{ color: textSecondary }}>
                  길드원 {s.memberCount}명 중 {s.participantCount}명 참여
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>
                  레이드 일정 {s.scheduleCount}개
                </p>
              </div>
            </div>

            <div
              className="mt-3 pt-3 border-t flex items-center justify-between"
              style={{ borderColor: dividerColor }}
            >
              <span className="text-xs" style={{ color: textSecondary }}>
                내 참여 현황
              </span>
              <span className="text-sm font-bold" style={{ color: primaryColor }}>
                {s.myCount}회 신청
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
