"use client";

import { useState } from "react";
import Link from "next/link";
import ScheduleCreateModal from "./ScheduleCreateModal";
import ScheduleDetailModal, { type RaidSchedule } from "./ScheduleDetailModal";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type RaidOption = {
  id: string;
  title: string;
  image_url: string;
  gold_normal: number | null;
  gold_hard: number | null;
  gold_nightmare: number | null;
};

type Cell = { day: number | null; dateStr: string | null };

type Props = {
  year: number;
  month: number;
  todayStr: string;
  calendarHref: string;
  guildCode: string;
  cells: Cell[];
  schedulesByDate: { [key: string]: RaidSchedule[] };
  raids: RaidOption[];
  currentUserId: string;
  currentUserRole: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
};

export default function RaidMonthWidgetClient({
  year,
  month,
  todayStr,
  calendarHref,
  guildCode,
  cells,
  schedulesByDate,
  raids,
  currentUserId,
  currentUserRole,
  textPrimary,
  textSecondary,
  accent,
  cardBg,
  cardBorder,
}: Props) {
  const [createDate, setCreateDate] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<RaidSchedule | null>(null);

  function onDayClick(dateStr: string) {
    const list = schedulesByDate[dateStr] || [];
    if (list.length === 0) {
      setCreateDate(dateStr);
      setCreateOpen(true);
    } else {
      // 일정이 여러 개면 첫 번째 일정의 상세를 띄움
      setDetail(list[0]);
    }
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: cardBorder }}
      >
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>
          레이드 달력
        </h2>
        <Link
          href={calendarHref}
          className="text-[11px] hover:underline"
          style={{ color: accent }}
        >
          {year}.{month} 전체 보기 →
        </Link>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="text-center text-[10px]"
              style={{ color: i === 0 ? "#f87171" : i === 6 ? "#22d3ee" : textSecondary }}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, idx) => {
            if (!c.day || !c.dateStr) {
              return <div key={idx} className="h-9" />;
            }
            const list = schedulesByDate[c.dateStr] || [];
            const hasRaid = list.length > 0;
            const multi = list.length > 1;
            const isToday = c.dateStr === todayStr;
            let bg = "transparent";
            let color = textSecondary;
            let weight: number = 400;
            if (isToday) {
              bg = accent;
              color = "#ffffff";
              weight = 700;
            } else if (hasRaid) {
              bg = accent + "22";
              color = accent;
              weight = 700;
            } else {
              color = textPrimary;
            }
            const dateStr = c.dateStr;
            const title = hasRaid
              ? multi
                ? `일정 ${list.length}건 · 첫 일정 상세 보기`
                : `${list[0].raidTitle} · 상세 보기`
              : "일정 만들기";
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDayClick(dateStr)}
                title={title}
                className="relative h-9 flex items-center justify-center rounded transition-opacity hover:opacity-80"
                style={{ backgroundColor: bg }}
              >
                <span className="text-xs" style={{ color: color, fontWeight: weight }}>
                  {c.day}
                </span>
                {multi ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {list.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <ScheduleCreateModal
        open={createOpen}
        date={createDate}
        guildCode={guildCode}
        raids={raids}
        onClose={() => setCreateOpen(false)}
      />

      <ScheduleDetailModal
        open={detail !== null}
        schedule={detail}
        guildCode={guildCode}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
