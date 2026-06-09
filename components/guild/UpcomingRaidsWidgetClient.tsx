"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScheduleDetailModal, { type RaidSchedule } from "./ScheduleDetailModal";
import { getMyCharacters, type MyCharacter } from "@/app/guild/[code]/raids/calendar/actions";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type RaidOption = {
  id: string;
  title: string;
  image_url: string;
  gold_normal: number | null;
  gold_hard: number | null;
  gold_nightmare: number | null;
};

type WeekCell = {
  dateStr: string;
  dayNum: number;
  weekday: number;
  count: number;
  isToday: boolean;
};

type Props = {
  guildCode: string;
  todayStr: string;
  weekCells: WeekCell[];
  upcoming: RaidSchedule[];
  weekSchedules: RaidSchedule[];
  raids: RaidOption[];
  currentUserId: string;
  currentUserRole: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  surface: string;
};

function diffBadge(diff: string): { bg: string; color: string } {
  if (diff === "하드") return { bg: "rgba(239,68,68,0.16)", color: "#f87171" };
  if (diff === "나메") return { bg: "rgba(139,92,246,0.16)", color: "#a78bfa" };
  return { bg: "rgba(234,179,8,0.16)", color: "#eab308" };
}

function roleBadge(role: "dealer" | "support" | null): { label: string; bg: string; color: string } | null {
  if (role === "support") return { label: "폿", bg: "rgba(16,185,129,0.2)", color: "#34d399" };
  if (role === "dealer") return { label: "딜", bg: "rgba(244,63,94,0.2)", color: "#fb7185" };
  return null;
}

export default function UpcomingRaidsWidgetClient({
  guildCode,
  todayStr,
  weekCells,
  upcoming,
  weekSchedules,
  raids,
  currentUserId,
  currentUserRole,
  textPrimary,
  textSecondary,
  accent,
  cardBg,
  cardBorder,
  surface,
}: Props) {
  const [detail, setDetail] = useState<RaidSchedule | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getMyCharacters(guildCode).then((list) => {
      if (alive) setMyCharacters(list);
    });
    return () => {
      alive = false;
    };
  }, [guildCode]);

  const calendarHref = `/guild/${guildCode}/raids/calendar`;

  const visibleList = selectedDate
    ? weekSchedules.filter((it) => it.scheduledDate === selectedDate)
    : upcoming;

  function handleSelectDate(dateStr: string, count: number) {
    if (count === 0) return;
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  const selectedLabel = selectedDate
    ? (() => {
        const dp = selectedDate.split("-");
        return `${Number(dp[1])}/${Number(dp[2])}`;
      })()
    : null;

  return (
    <div className="rounded-lg border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div
        className="flex items-center justify-between rounded-t-lg px-4 py-2.5 border-b"
        style={{ borderColor: cardBorder }}
      >
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>레이드 일정</h2>
        <Link href={calendarHref} className="text-[11px] hover:underline" style={{ color: accent }}>
          전체 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pt-3">
        {weekCells.map((c) => {
          const isSelected = selectedDate === c.dateStr;
          return (
            <button
              key={c.dateStr}
              type="button"
              onClick={() => handleSelectDate(c.dateStr, c.count)}
              className="flex flex-col items-center rounded-md py-1.5 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: isSelected
                  ? accent
                  : c.isToday
                  ? accent + "33"
                  : c.count > 0
                  ? surface
                  : "transparent",
                cursor: c.count > 0 ? "pointer" : "default",
                outline: isSelected ? `2px solid ${accent}` : "none",
              }}
            >
              <span
                className="text-[9px]"
                style={{
                  color: isSelected
                    ? "#ffffff"
                    : c.weekday === 0
                    ? "#f87171"
                    : c.weekday === 6
                    ? "#22d3ee"
                    : textSecondary,
                }}
              >
                {WEEKDAYS[c.weekday]}
              </span>
              <span className="text-xs font-bold" style={{ color: isSelected ? "#ffffff" : textPrimary }}>
                {c.dayNum}
              </span>
              <span className="mt-0.5 h-1.5 flex items-center">
                {c.count > 0 ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? "#ffffff" : accent }}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] font-mono" style={{ color: accent }}>
            {selectedLabel} 일정 {visibleList.length}개
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="text-[11px] hover:underline"
            style={{ color: textSecondary }}
          >
            전체 보기
          </button>
        </div>
      ) : null}

      <div className="p-3 space-y-1.5">
        {visibleList.length === 0 ? (
          <Link
            href={calendarHref}
            className="block rounded-md border border-dashed py-4 text-center text-xs transition-opacity hover:opacity-80"
            style={{ borderColor: cardBorder, color: textSecondary }}
          >
            {selectedDate ? "이 날짜에 일정이 없어요" : "예정된 레이드가 없어요 · 일정 만들기 →"}
          </Link>
        ) : (
          visibleList.map((it) => {
            const badge = diffBadge(it.difficulty);
            const dp = it.scheduledDate.split("-");
            const dateLabel = `${Number(dp[1])}/${Number(dp[2])}`;
            const showHover = hoverId === it.id;

            return (
              <div
                key={it.id}
                className="relative"
                onMouseEnter={() => setHoverId(it.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <button
                  type="button"
                  onClick={() => setDetail(it)}
                  className={`flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-opacity hover:opacity-90 ${
                    it.completed ? "opacity-60" : ""
                  }`}
                  style={{ backgroundColor: surface }}
                >
                  {it.raidImage ? (
                    <img src={it.raidImage} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {it.raidTitle.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold truncate" style={{ color: textPrimary }}>
                        {it.completed ? "✓ " : ""}
                        {it.raidTitle}
                      </span>
                      <span className="text-xs font-bold font-mono shrink-0" style={{ color: accent }}>
                        {dateLabel} {it.scheduledTime}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {it.difficulty}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono shrink-0" style={{ color: textSecondary }}>
                    {it.participantCount}/{it.maxMembers}
                  </span>
                </button>

                {showHover ? (
                  <div
                    className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border p-2 shadow-xl"
                    style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  >
                    <p className="mb-1.5 px-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: textSecondary }}>
                      참여자 {it.participants.length}명
                    </p>
                    <div className="max-h-44 space-y-1 overflow-y-auto">
                      {it.participants.length === 0 ? (
                        <p className="px-1 py-2 text-center text-[10px]" style={{ color: textSecondary }}>
                          아직 참여자가 없어요
                        </p>
                      ) : (
                        it.participants.map((p) => {
                          const rb = roleBadge(p.role);
                          const ilvl = p.itemLevel != null ? Math.floor(p.itemLevel).toLocaleString() : null;
                          return (
                            <div
                              key={p.userId}
                              className="flex items-center gap-2 rounded-md px-1.5 py-1"
                              style={{ backgroundColor: surface }}
                            >
                              {p.avatar ? (
                                <img src={p.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                  style={{ backgroundColor: accent }}
                                >
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-medium" style={{ color: textPrimary }}>
                                  {p.name}
                                </p>
                                {p.characterClass ? (
                                  <p className="truncate text-[9px]" style={{ color: textSecondary }}>
                                    {p.characterClass}
                                    {ilvl ? ` · Lv ${ilvl}` : ""}
                                  </p>
                                ) : null}
                              </div>
                              {rb ? (
                                <span
                                  className="shrink-0 rounded px-1 text-[9px] font-bold"
                                  style={{ backgroundColor: rb.bg, color: rb.color }}
                                >
                                  {rb.label}
                                </span>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <ScheduleDetailModal
        open={detail !== null}
        schedule={detail}
        guildCode={guildCode}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        myCharacters={myCharacters}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
