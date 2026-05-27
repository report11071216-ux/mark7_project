"use client";
import Link from "next/link";
import { Crown, Trophy, Award, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { RankedGuild } from "./PodiumTop3";
type Props = {
  guilds: RankedGuild[];
};
export default function TopRankCompact({ guilds }: Props) {
  if (guilds.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-slate-200 p-6 text-center">
        <p className="text-slate-400 text-sm">아직 랭킹 데이터가 없습니다</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
      {/* 남색 제목띠 */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-300" />
          <h3 className="text-base font-bold text-white">주간 길드 랭킹</h3>
        </div>
        <Link
          href="/plaza/ranking"
          className="text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-0.5"
        >
          전체 랭킹
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-5 divide-x divide-slate-200">
        {guilds.slice(0, 5).map((g, i) => (
          <RankCard key={g.id} guild={g} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
function RankCard(props: { guild: RankedGuild; rank: number }) {
  const guild = props.guild;
  const rank = props.rank;
  const isFirst = rank === 1;
  let Icon: any = null;
  if (rank === 1) Icon = Crown;
  else if (rank === 2) Icon = Trophy;
  else if (rank === 3) Icon = Award;
  let rankColor = "text-slate-400";
  if (rank === 1) rankColor = "text-yellow-500";
  else if (rank === 2) rankColor = "text-slate-500";
  else if (rank === 3) rankColor = "text-amber-500";
  const cardClass = isFirst
    ? "block p-4 transition hover:bg-slate-50 bg-gradient-to-b from-yellow-50 to-transparent"
    : "block p-4 transition hover:bg-slate-50";
  const pointColor = isFirst ? "text-yellow-600" : "text-slate-700";
  return (
    <Link href={"/guild/" + guild.code} className={cardClass}>
      <div className="flex items-center gap-1 mb-2">
        {Icon ? (
          <Icon className={"w-3.5 h-3.5 " + rankColor} />
        ) : (
          <span className="w-3.5" />
        )}
        <span className={"text-xs font-bold " + rankColor}>#{rank}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {guild.logo_url ? (
          <img
            src={guild.logo_url}
            alt={guild.name}
            className="w-8 h-8 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">
            {guild.name.charAt(0)}
          </div>
        )}
        <p className="text-sm font-bold text-slate-900 truncate flex-1">
          {guild.name}
        </p>
      </div>
      <p className={"text-lg font-bold " + pointColor}>
        {formatNumber(guild.points)}
        <span className="text-xs text-slate-400 ml-0.5">P</span>
      </p>
    </Link>
  );
}
