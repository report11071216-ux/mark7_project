// components/guild/MiniCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAttendanceDate } from "@/lib/attendance";

type View = "month" | "week" | "day";

type Props = {
  attendanceDates: string[];
};

export default function MiniCalendar({ attendanceDates }: Props) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const attendedSet = useMemo(() => new Set(attendanceDates), [attendanceDates]);
  const today = getAttendanceDate();

  function handleViewChange(v: View) {
    setView(v);
    setCursor(new Date());
  }

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="mb-3">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">
          CALENDAR
        </p>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white whitespace-nowrap">출석 캘린더</h3>
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1 shrink-0">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-2 py-0.5 text-[11px] font-mono uppercase rounded transition ${
                  view === v
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {v === "month" ? "월" : v === "week" ? "주" : "일"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {view === "month" && (
        <MonthView cursor={cursor} setCursor={setCursor} attendanceDates={attendanceDates} attendedSet={attendedSet} today={today} />
      )}
      {view === "week" && (
        <WeekView cursor={cursor} setCursor={setCursor} attendedSet={attendedSet} today={today} />
      )}
      {view === "day" && (
        <DayView cursor={cursor} setCursor={setCursor} attendedSet={attendedSet} today={today} />
      )}
    </Card>
  );
}

function MonthView({ cursor, setCursor, attendanceDates, attendedSet, today }: any) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthCount = (attendanceDates as string[]).filter((d) =>
    d.startsWith(monthPrefix)
  ).length;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <p className="text-xs font-bold text-white text-center">
          {year}년 {month + 1}월
          <span className="text-violet-400 ml-1.5">{monthCount}일 출석</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="text-center text-[10px] font-mono text-zinc-600">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="h-8" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isAttended = attendedSet.has(dateStr);
          const isToday = dateStr === today;
          return (
            <div
              key={i}
              className={`h-8 flex items-center justify-center text-xs rounded transition ${
                isAttended
                  ? "bg-violet-500/30 text-violet-200 font-bold border border-violet-500/50"
                  : "text-zinc-500 hover:bg-zinc-800/50"
              } ${isToday ? "ring-2 ring-cyan-400/50" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekView({ cursor, setCursor, attendedSet, today }: any) {
  const sunday = new Date(cursor);
  sunday.setDate(cursor.getDate() - cursor.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
  const weekCount = days.filter((d) => {
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return attendedSet.has(s);
  }).length;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 7);
            setCursor(prev);
          }}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <p className="text-xs font-bold text-white text-center">
          {sunday.getMonth() + 1}/{sunday.getDate()} 주
          <span className="text-violet-400 ml-1.5">{weekCount}/7일</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = new Date(cursor);
            next.setDate(next.getDate() + 7);
            setCursor(next);
          }}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const isAttended = attendedSet.has(dateStr);
          const isToday = dateStr === today;
          const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
          return (
            <div
              key={i}
              className={`flex flex-col items-center py-2 rounded-lg border ${
                isAttended
                  ? "bg-violet-500/20 border-violet-500/40"
                  : "bg-zinc-800/30 border-zinc-700/50"
              } ${isToday ? "ring-2 ring-cyan-400/50" : ""}`}
            >
              <p className="text-[10px] font-mono text-zinc-500">{dayLabels[i]}</p>
              <p className={`text-base font-bold ${isAttended ? "text-violet-200" : "text-zinc-400"}`}>
                {d.getDate()}
              </p>
              <p className={`text-[10px] ${isAttended ? "text-violet-300" : "text-zinc-600"}`}>
                {isAttended ? "✓" : "—"}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DayView({ cursor, setCursor, attendedSet, today }: any) {
  const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
  const isAttended = attendedSet.has(dateStr);
  const isToday = dateStr === today;
  const dayLabels = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            setCursor(prev);
          }}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <p className="text-xs font-bold text-white text-center">
          {cursor.getFullYear()}.{cursor.getMonth() + 1}.{cursor.getDate()}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = new Date(cursor);
            next.setDate(next.getDate() + 1);
            setCursor(next);
          }}
          className="h-7 px-2 text-zinc-400 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div
        className={`p-5 rounded-xl border text-center ${
          isAttended
            ? "bg-gradient-to-br from-violet-500/20 to-violet-500/5 border-violet-500/40"
            : "bg-zinc-800/30 border-zinc-700/50"
        } ${isToday ? "ring-2 ring-cyan-400/50" : ""}`}
      >
        <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
          {dayLabels[cursor.getDay()]}
        </p>
        <p className="text-4xl font-bold text-white mb-2">{cursor.getDate()}</p>
        {isAttended ? (
          <p className="text-sm text-violet-300 font-bold">✓ 출석 완료 (+1P)</p>
        ) : (
          <p className="text-sm text-zinc-500">미출석</p>
        )}
        {isToday && <p className="text-[10px] text-cyan-400 font-mono mt-1.5">TODAY</p>}
      </div>
    </>
  );
}
