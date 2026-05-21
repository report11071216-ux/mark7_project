// components/plaza/PodiumTop3.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Crown, Trophy, Award, Users } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

export type RankedGuild = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  member_count: number | null;
  master_name: string | null;
  points: number; // 탭에 따라 total_points 또는 집계값
};

type Props = {
  guilds: RankedGuild[]; // 최대 3개
  metricLabel: string; // "누적 P" / "이번 주 P" / "이번 달 P"
};

export default function PodiumTop3({ guilds, metricLabel }: Props) {
  // 순서 재배치: 2등(왼쪽), 1등(가운데), 3등(오른쪽)
  const [first, second, third] = guilds;
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 items-end mb-6">
      {/* 2등 */}
      <PodiumCard guild={second} rank={2} metricLabel={metricLabel} />
      {/* 1등 */}
      <PodiumCard guild={first} rank={1} metricLabel={metricLabel} />
      {/* 3등 */}
      <PodiumCard guild={third} rank={3} metricLabel={metricLabel} />
    </div>
  );
}

function PodiumCard({
  guild,
  rank,
  metricLabel,
}: {
  guild: RankedGuild | undefined;
  rank: 1 | 2 | 3;
  metricLabel: string;
}) {
  if (!guild) {
    return (
      <div className={`flex flex-col items-center ${rank === 1 ? "pb-0" : "pb-6"}`}>
        <div className="w-full bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-4 text-center text-zinc-600 text-xs">
          —
        </div>
      </div>
    );
  }

  const isFirst = rank === 1;
  const Icon = rank === 1 ? Crown : rank === 2 ? Trophy : Award;
  const iconColor =
    rank === 1
      ? "text-yellow-300"
      : rank === 2
      ? "text-zinc-300"
      : "text-amber-500";
  const borderColor =
    rank === 1
      ? "border-yellow-500/50"
      : rank === 2
      ? "border-zinc-500/40"
      : "border-amber-600/40";
  const glowClass = isFirst
    ? "shadow-[0_0_40px_rgba(250,204,21,0.25)]"
    : rank === 2
    ? "shadow-[0_0_20px_rgba(161,161,170,0.15)]"
    : "shadow-[0_0_20px_rgba(217,119,6,0.15)]";

  return (
    <Link href={`/guild/${guild.code}`} className="block group">
      <div
        className={`flex flex-col items-center ${isFirst ? "pb-0" : "pb-6"}`}
      >
        {/* 순위 뱃지 */}
        <div
          className={`mb-3 flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 border ${borderColor}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className={`text-xs font-mono font-bold ${iconColor}`}>
            {rank === 1 ? "CHAMPION" : `RANK ${rank}`}
          </span>
        </div>
        {/* 카드 */}
        <Card
          className={`w-full bg-gradient-to-br ${
            isFirst
              ? "from-yellow-500/10 via-zinc-900/80 to-zinc-900/50"
              : rank === 2
              ? "from-zinc-700/20 via-zinc-900/80 to-zinc-900/50"
              : "from-amber-700/15 via-zinc-900/80 to-zinc-900/50"
          } border ${borderColor} ${glowClass} backdrop-blur p-4 md:p-5 transition group-hover:scale-[1.02] group-hover:border-opacity-80`}
        >
          {/* 길드 로고 */}
          <div className="flex justify-center mb-3">
            {guild.logo_url ? (
              <img
                src={guild.logo_url}
                alt={guild.name}
                className={`rounded-full object-cover ${
                  isFirst ? "w-20 h-20" : "w-16 h-16"
                } border-2 ${borderColor}`}
              />
            ) : (
              <div
                className={`rounded-full bg-zinc-800 border-2 ${borderColor} flex items-center justify-center ${
                  isFirst ? "w-20 h-20" : "w-16 h-16"
                }`}
              >
                <Icon className={`${isFirst ? "w-10 h-10" : "w-8 h-8"} ${iconColor}`} />
              </div>
            )}
          </div>
          {/* 길드 이름 */}
          <h3
            className={`text-center font-bold text-white mb-1 truncate ${
              isFirst ? "text-base md:text-lg" : "text-sm md:text-base"
            }`}
          >
            {guild.name}
          </h3>
          {/* 마스터 */}
          {guild.master_name && (
            <p className="text-center text-xs text-zinc-500 font-mono mb-2 truncate">
              by {guild.master_name}
            </p>
          )}
          {/* 포인트 */}
          <div className="text-center">
            <p
              className={`font-bold ${
                isFirst ? "text-2xl text-yellow-300" : "text-xl text-white"
              }`}
            >
              {formatNumber(guild.points)}
            </p>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {metricLabel}
            </p>
          </div>
          {/* 멤버 수 */}
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-zinc-400">
            <Users className="w-3 h-3" />
            <span className="font-mono">{guild.member_count ?? 0}명</span>
          </div>
        </Card>
      </div>
    </Link>
  );
}
