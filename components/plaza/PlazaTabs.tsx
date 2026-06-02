// components/plaza/PlazaTabs.tsx
"use client";

import { useState } from "react";
import PodiumTop3 from "./PodiumTop3";
import RankingList from "./RankingList";
import { getWeekLabel, getMonthLabel } from "@/lib/ranking";
import type { RankedGuild } from "./PodiumTop3";

type Tab = "total" | "weekly" | "monthly";

export default function PlazaTabs({ totalList, weeklyList, monthlyList }: { totalList: RankedGuild[]; weeklyList: RankedGuild[]; monthlyList: RankedGuild[] }) {
  const [tab, setTab] = useState<Tab>("total");
  const current = tab === "total" ? totalList : tab === "weekly" ? weeklyList : monthlyList;
  const top3 = current.slice(0, 3);
  const rest = current.slice(3, 100);
  const startRank = top3.length + 1;
  const metricLabel = tab === "total" ? "누적 EXP" : tab === "weekly" ? "이번주 P" : "이번달 P";
  const periodLabel = tab === "total" ? "전체 기간" : tab === "weekly" ? getWeekLabel() : getMonthLabel();

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="inline-flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          <TabBtn active={tab === "total"} onClick={() => setTab("total")}>전체</TabBtn>
          <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")}>이번 주</TabBtn>
          <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")}>이번 달</TabBtn>
        </div>
        <p className="text-xs font-mono text-slate-400 tracking-wider">{periodLabel}</p>
      </div>

      {top3.length > 0 ? (
        <PodiumTop3 guilds={top3} metricLabel={metricLabel} />
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl mb-6">
          <p className="text-slate-400">{tab === "total" ? "아직 길드가 없습니다" : "이 기간 동안 활동한 길드가 없습니다"}</p>
        </div>
      )}

      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-3 mt-8">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="text-xs font-mono text-slate-400 tracking-wider">RANK {startRank}~{startRank + rest.length - 1}</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <RankingList guilds={rest} startRank={startRank} metricLabel={metricLabel} />
        </>
      )}
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-violet-50 text-violet-700" : "text-slate-400 hover:text-slate-700"}`}>
      {children}
    </button>
  );
}
