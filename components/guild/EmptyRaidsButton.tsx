"use client";

import { useState } from "react";
import ScheduleCreateModal from "./ScheduleCreateModal";

type RaidOption = {
  id: string;
  title: string;
  image_url: string;
  gold_normal: number | null;
  gold_hard: number | null;
  gold_nightmare: number | null;
};

type Props = {
  guildCode: string;
  todayStr: string;
  raids: RaidOption[];
  textSecondary: string;
  accent: string;
  surface: string;
};

export default function EmptyRaidsButton({
  guildCode,
  todayStr,
  raids,
  textSecondary,
  accent,
  surface,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="rounded-md py-4 text-center"
        style={{ backgroundColor: surface }}
      >
        <p className="text-xs mb-2.5" style={{ color: textSecondary }}>
          다가오는 레이드 일정이 없어요
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          + 일정 만들기
        </button>
      </div>

      <ScheduleCreateModal
        open={open}
        date={todayStr}
        guildCode={guildCode}
        raids={raids}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
