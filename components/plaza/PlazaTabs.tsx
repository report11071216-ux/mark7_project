// components/plaza/PlazaTabs.tsx
"use client";

import { useState } from "react";
import PodiumTop3 from "./PodiumTop3";
import RankingList from "./RankingList";
import { getWeekLabel, getMonthLabel } from "@/lib/ranking";
import type { RankedGuild } from "./PodiumTop3";

type Tab = "total" | "weekly" | "monthly";

type Props = {
  totalList: RankedGuild[];
  weeklyList: RankedGuild[];
  monthlyList: RankedGuild[];
};

export default function PlazaTabs({ totalList, weeklyList, monthlyList }: Props) {
  const [tab, setTab] = useState<Tab>("total");

  const current =
    tab === "total" ? totalList : tab === "weekly" ? weeklyList : monthlyList;
  const top3 = current.slice(0, 3);
  const rest = current.slice(3, 100);
  const startRank = top3.length + 1;

  const metricLabel =
    tab === "total" ? "누적 P" : tab === "weekly" ? "이번주 P" : "이번달 P";
  const periodLabel =
    tab === "total"
      ? "전체 기간"
      : tab === "weekly"
      ? getWeekLabel()
      : getMonthLabel();

  return (
    <>
      {/* 탭 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
          <TabBtn active={tab === "total"} onClick={() => setTab("total")}>
            전체
          </TabBtn>
          <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")}>
            이번 주
          </TabBtn>
          <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")}>
            이번 달
          </TabBtn>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {periodLabel}
        </p>
      </div>

      {/* 시상대 */}
      {top3.length > 0 ? (
        <PodiumTop3 guilds={top3} metricLabel={metricLabel} />
      ) : (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-xl mb-6">
          <p className="text-zinc-500">
            {tab === "total" ? "아직 길드가 없습니다" : "이 기간 동안 출석한 길드가 없습니다"}
          </p>
        </div>
      )}

      {/* 4등~ 리스트 */}
      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-3 mt-8">
            <div className="h-px flex-1 bg-zinc-800" />
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              RANK {startRank}~{startRank + rest.length - 1}
            </p>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <RankingList guilds={rest} startRank={startRank} metricLabel={metricLabel} />
        </>
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
        active
          ? "bg-violet-500/20 text-violet-200 shadow-[0_0_15px_rgba(167,139,250,0.15)]"
          : "text-zinc-500 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
