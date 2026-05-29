"use client";
import Link from "next/link";
import { Crown, Trophy, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { RankedGuild } from "./PodiumTop3";

type Props = {
  guilds: RankedGuild[];
};

export default function TopRankCompact({ guilds }: Props) {
  // 항상 3칸 (TOP3). 부족하면 빈 슬롯으로 채움
  const top3 = guilds.slice(0, 3);
  const slots: (RankedGuild | null)[] = [
    top3[0] ?? null,
    top3[1] ?? null,
    top3[2] ?? null,
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((g, i) => (
        <RankCard key={g ? g.id : "empty-" + i} guild={g} rank={i + 1} />
      ))}
    </div>
  );
}

function RankCard(props: { guild: RankedGuild | null; rank: number }) {
  const guild = props.guild;
  const rank = props.rank;
  const isFirst = rank === 1;

  let Icon: any = Award;
  if (rank === 1) Icon = Crown;
  else if (rank === 2) Icon = Trophy;

  let rankColor = "text-amber-500";
  if (rank === 1) rankColor = "text-yellow-500";
  else if (rank === 2) rankColor = "text-slate-400";

  // 빈 슬롯
  if (!guild) {
    return (
      <div className="rounded-xl ring-1 ring-slate-200 bg-slate-50/60 p-4 flex flex-col items-center justify-center text-center min-h-[150px]">
        <Icon className={"w-5 h-5 mb-2 " + rankColor + " opacity-40"} />
        <span className={"text-xs font-bold mb-1 " + rankColor + " opacity-50"}>#{rank}</span>
        <div className="w-10 h-10 rounded-lg bg-slate-200/70 mb-2" />
        <p className="text-xs text-slate-300">비어있음</p>
      </div>
    );
  }

  const cardClass = isFirst
    ? "rounded-xl ring-1 ring-yellow-200 bg-gradient-to-b from-yellow-50 to-white p-4 flex flex-col items-center text-center min-h-[150px] hover:ring-yellow-300 transition"
    : "rounded-xl ring-1 ring-slate-200 bg-white p-4 flex flex-col items-center text-center min-h-[150px] hover:ring-slate-300 transition";
  const pointColor = isFirst ? "text-yellow-600" : "text-slate-700";

  return (
    <Link href={"/guild/" + guild.code} className={cardClass}>
      <Icon className={"w-5 h-5 mb-1.5 " + rankColor} />
      <span className={"text-xs font-bold mb-2 " + rankColor}>#{rank}</span>
      {guild.logo_url ? (
        <img
          src={guild.logo_url}
          alt={guild.name}
          className="w-12 h-12 rounded-xl object-cover mb-2 shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 text-base font-bold mb-2 shrink-0">
          {guild.name.charAt(0)}
        </div>
      )}
      <p className="text-sm font-bold text-slate-900 truncate w-full mb-1">
        {guild.name}
      </p>
      <p className={"text-lg font-bold " + pointColor}>
        {formatNumber(guild.points)}
        <span className="text-xs text-slate-400 ml-0.5">P</span>
      </p>
    </Link>
  );
}
