// components/plaza/RankingList.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import type { RankedGuild } from "./PodiumTop3";

type Props = {
  guilds: RankedGuild[]; // 4등부터 시작 (이미 잘라서 전달)
  startRank: number; // 보통 4
  metricLabel: string;
};

export default function RankingList({ guilds, startRank, metricLabel }: Props) {
  if (guilds.length === 0) {
    return (
      <Card className="p-12 bg-zinc-900/30 border-zinc-800 backdrop-blur text-center">
        <p className="text-zinc-500">랭킹 데이터가 아직 없습니다</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {guilds.map((guild, i) => {
        const rank = startRank + i;
        return (
          <Link key={guild.id} href={`/guild/${guild.code}`} className="block group">
            <Card className="p-4 bg-zinc-900/40 border-zinc-800 backdrop-blur transition hover:border-violet-500/30 hover:bg-zinc-900/60">
              <div className="flex items-center gap-4">
                {/* 순위 */}
                <div className="w-10 text-center flex-shrink-0">
                  <p className="text-xl font-bold font-mono text-zinc-500 group-hover:text-violet-300 transition">
                    {rank}
                  </p>
                </div>
                {/* 로고 */}
                <div className="flex-shrink-0">
                  {guild.logo_url ? (
                    <img
                      src={guild.logo_url}
                      alt={guild.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-sm">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* 이름 + 마스터 */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{guild.name}</p>
                  {guild.master_name && (
                    <p className="text-xs text-zinc-500 font-mono truncate">
                      by {guild.master_name}
                    </p>
                  )}
                </div>
                {/* 멤버 수 */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                  <Users className="w-3 h-3" />
                  <span className="font-mono">{guild.member_count ?? 0}</span>
                </div>
                {/* 포인트 */}
                <div className="text-right flex-shrink-0 min-w-[70px]">
                  <p className="font-bold text-violet-300 font-mono">
                    {formatNumber(guild.points)}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase">
                    {metricLabel}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
