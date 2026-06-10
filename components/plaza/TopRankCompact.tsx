"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { RankedGuild } from "./PodiumTop3";
import GuildCard from "@/components/guild/GuildCard";

function gradeOf(exp: number) {
  if (exp >= 12000) return { label: "그랜드마스터", color: "#dc2626" };
  if (exp >= 6000) return { label: "마스터", color: "#9333ea" };
  if (exp >= 3000) return { label: "다이아몬드", color: "#0891b2" };
  if (exp >= 1500) return { label: "에메랄드", color: "#059669" };
  if (exp >= 700) return { label: "플래티넘", color: "#7c3aed" };
  if (exp >= 300) return { label: "골드", color: "#ca8a04" };
  if (exp >= 100) return { label: "실버", color: "#64748b" };
  return { label: "브론즈", color: "#b45309" };
}

export default function TopRankCompact({ guilds }: { guilds: RankedGuild[] }) {
  const top3 = guilds.slice(0, 3);
  const slots: (RankedGuild | null)[] = [
    top3[0] ?? null,
    top3[1] ?? null,
    top3[2] ?? null,
  ];
  return (
    <div className="space-y-2.5" style={{ maxWidth: 620 }}>
      {slots.map((g, i) => (
        <RankRow key={g ? g.id : "empty-" + i} guild={g} rank={i + 1} />
      ))}
    </div>
  );
}

function RankRow({ guild, rank }: { guild: RankedGuild | null; rank: number }) {
  const isFirst = rank === 1;
  let numColor = "#94a3b8";
  if (rank === 1) numColor = "#ba7517";

  if (!guild) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="w-[30px] shrink-0 text-center text-[19px] font-bold"
          style={{ color: numColor, opacity: 0.5 }}
        >
          {rank}
        </div>
        <div
          className="flex-1 rounded-[14px] border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xs"
          style={{ aspectRatio: "16 / 6.5" }}
        >
          비어있음
        </div>
      </div>
    );
  }

  const grade = gradeOf(guild.exp ?? guild.points);
  const serverText = guild.server ? guild.server + " 서버" : undefined;

  return (
    <Link href={"/guild/" + guild.code} className="flex items-center gap-3 group">
      <div className="w-[30px] shrink-0 text-center" style={{ color: numColor }}>
        {isFirst ? (
          <Crown className="w-[18px] h-[18px] mx-auto" />
        ) : (
          <span className="text-[19px] font-bold">{rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 transition group-hover:-translate-y-0.5">
        <GuildCard
          guildName={guild.name}
          server={serverText}
          grade={guild.grade}
          markUrl={guild.logo_url}
          tierLabel={grade.label}
          tierColor={grade.color}
          statText={formatNumber(guild.points) + "P"}
        />
      </div>
    </Link>
  );
}
