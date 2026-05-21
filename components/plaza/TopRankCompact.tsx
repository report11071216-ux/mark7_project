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
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center">
        <p className="text-zinc-500 text-sm">아직 랭킹 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] font-bold">
            THIS WEEK · TOP 5
          </span>
        </div>
        <Link
          href="/plaza/ranking"
          className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition flex items-center gap-0.5"
        >
          전체 랭킹
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-5 divide-x divide-zinc-800/60">
        {guilds.slice(0, 5).map(function (g, i) {
          return <RankCard key={g.id} guild={g} rank={i + 1} />;
        })}
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

  let rankColor = "text-zinc-500";
  if (rank === 1) rankColor = "text-yellow-300";
  else if (rank === 2) rankColor = "text-zinc-300";
  else if (rank === 3) rankColor = "text-amber-500";

  const cardClass = isFirst
    ? "block p-3 transition hover:bg-zinc-800/30 bg-gradient-to-b from-yellow-500/5 to-transparent"
    : "block p-3 transition hover:bg-zinc-800/30";

  const pointColor = isFirst ? "text-yellow-300" : "text-violet-300";

  return (
    <Link href={"/guild/" + guild.code} className={cardClass}>
      <div className="flex items-center gap-1 mb-2">
        {Icon ? (
          <Icon className={"w-3 h-3 " + rankColor} />
        ) : (
          <span className="w-3" />
        )}
        <span className={"text-[10px] font-mono font-bold " + rankColor}>
          #{rank}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        {guild.logo_url ? (
          <img
            src={guild.logo_url}
            alt={guild.name}
            className="w-7 h-7 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-md bg-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
            {guild.name.charAt(0)}
          </div>
        )}
        <p className="text-xs font-bold text-white truncate flex-1">
          {guild.name}
        </p>
      </div>
      <p className={"text-sm font-bold font-mono " + pointColor}>
        {formatNumber(guild.points)}
        <span className="text-[10px] text-zinc-500 ml-0.5">P</span>
      </p>
    </Link>
  );
}
