// components/plaza/RankingList.tsx
"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { getGuildGrade, GRADE_BADGE_LIGHT } from "./PodiumTop3";
import type { RankedGuild } from "./PodiumTop3";

export default function RankingList({ guilds, startRank, metricLabel }: { guilds: RankedGuild[]; startRank: number; metricLabel: string }) {
  if (guilds.length === 0) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-xl text-center">
        <p className="text-slate-400">랭킹 데이터가 아직 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {guilds.map((guild, i) => {
        const rank = startRank + i;
        const grade = getGuildGrade(guild.exp ?? guild.points);
        const gradeStyle = GRADE_BADGE_LIGHT[grade.tone];
        return (
          <Link key={guild.id} href={`/guild/${guild.code}`} className="block group">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 transition hover:border-violet-300 hover:shadow-sm">
              <span className="w-6 text-center font-mono font-medium text-slate-400 text-sm flex-shrink-0">{rank}</span>

              <div className="flex-shrink-0">
                {guild.logo_url ? (
                  <img src={guild.logo_url} alt={guild.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-sm font-medium">{guild.name.charAt(0)}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate text-sm">{guild.name}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {guild.server && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#ecfeff", color: "#0e7490" }}>{guild.server}</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: gradeStyle.bg, color: gradeStyle.color }}>{grade.name}</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                <Users className="w-3 h-3" />
                <span className="font-mono">{guild.member_count ?? 0}</span>
              </div>

              <div className="text-right flex-shrink-0" style={{ minWidth: 70 }}>
                <p className="font-medium text-slate-900 font-mono text-sm">{formatNumber(guild.points)}</p>
                <p className="text-[10px] text-slate-400 font-mono">{metricLabel}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
