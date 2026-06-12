"use client";

import { useState } from "react";
import GuildCard from "@/components/guild/GuildCard";
import GradeEmblem from "@/components/guild/GradeEmblem";
import RankingModal from "./RankingModal";
import { formatNumber } from "@/lib/utils";

export type RankedGuild = {
  id: string;
  code: string;
  name: string;
  markUrl: string | null;
  memberCount: number;
  exp: number;
  server: string | null;
  isRecruiting: boolean;
  cardImageUrl: string | null;
  cardDesign: { [effect: string]: any } | null;
};

export function gradeOf(exp: number) {
  if (exp >= 12000) return { label: "그랜드마스터", color: "#dc2626" };
  if (exp >= 6000) return { label: "마스터", color: "#9333ea" };
  if (exp >= 3000) return { label: "다이아몬드", color: "#0891b2" };
  if (exp >= 1500) return { label: "에메랄드", color: "#059669" };
  if (exp >= 700) return { label: "플래티넘", color: "#7c3aed" };
  if (exp >= 300) return { label: "골드", color: "#ca8a04" };
  if (exp >= 100) return { label: "실버", color: "#64748b" };
  return { label: "브론즈", color: "#b45309" };
}

const RANK_META: { [key: number]: { label: string; color: string } } = {
  1: { label: "FIRST", color: "#fac775" },
  2: { label: "SECOND", color: "#c5c3d4" },
  3: { label: "THIRD", color: "#d8a878" },
};

export default function RankingBoard({
  guilds,
  isLoggedIn,
}: {
  guilds: RankedGuild[];
  isLoggedIn: boolean;
}) {
  const [selected, setSelected] = useState<{ guild: RankedGuild; rank: number } | null>(null);

  if (guilds.length === 0) {
    return (
      <div className="text-center py-16 bg-plaza-surface border border-plaza-line rounded-xl">
        <p className="text-plaza-ink-dim">아직 길드가 없습니다</p>
      </div>
    );
  }

  const first = guilds[0];
  const second = guilds[1];
  const third = guilds[2];
  const rest = guilds.slice(3, 10);

  function PodiumCol({ guild, rank }: { guild: RankedGuild | undefined; rank: number }) {
    if (!guild) {
      return (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5 mb-2 px-1">
            <span className="text-lg font-bold" style={{ color: RANK_META[rank].color }}>{rank}</span>
            <span className="text-[10px] font-mono text-plaza-ink-dim">{RANK_META[rank].label}</span>
          </div>
          <div className="rounded-xl border border-dashed border-plaza-line text-plaza-ink-dim text-xs flex items-center justify-center aspect-[16/8]">—</div>
        </div>
      );
    }
    const grade = gradeOf(guild.exp);
    const isFirst = rank === 1;
    return (
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 mb-2 px-1">
          <span className={isFirst ? "text-2xl font-bold" : "text-lg font-bold"} style={{ color: RANK_META[rank].color }}>{rank}</span>
          <span className="text-[10px] font-mono text-plaza-ink-dim">{RANK_META[rank].label}</span>
        </div>
        <button
          type="button"
          onClick={() => setSelected({ guild, rank })}
          className="block w-full text-left rounded-xl overflow-hidden transition hover:-translate-y-0.5"
          style={isFirst ? { boxShadow: "0 0 0 1.5px #fac775" } : undefined}
        >
          <GuildCard
            guildName={guild.name}
            server={guild.server ? guild.server + " 서버" : undefined}
            grade="custom"
            markUrl={guild.markUrl}
            imageUrl={guild.cardImageUrl}
            tierLabel={grade.label}
            tierColor={grade.color}
            statText={formatNumber(guild.exp) + " EXP"}
            design={guild.cardDesign}
          />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 포디움 1·2·3 */}
      <div className="grid grid-cols-3 gap-3 items-end mb-6">
        <PodiumCol guild={second} rank={2} />
        <PodiumCol guild={first} rank={1} />
        <PodiumCol guild={third} rank={3} />
      </div>

      {/* 4~10위 리스트 */}
      {rest.length > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-3 mt-8">
            <div className="h-px flex-1 bg-plaza-line" />
            <p className="text-xs font-mono text-plaza-ink-dim tracking-wider">RANK 4–{3 + rest.length}</p>
            <div className="h-px flex-1 bg-plaza-line" />
          </div>
          <div className="space-y-2">
            {rest.map((g, i) => {
              const rank = i + 4;
              const grade = gradeOf(g.exp);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelected({ guild: g, rank })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-plaza-surface border border-plaza-line rounded-xl hover:border-plaza-accent transition text-left"
                >
                  <span className="text-sm font-bold text-plaza-ink-soft w-5 shrink-0">{rank}</span>
                  {g.markUrl ? (
                    <img src={g.markUrl} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-plaza-line shrink-0" />
                  ) : (
                    <div className="w-8 h-8 shrink-0">
                      <GradeEmblem tierLabel={grade.label} size={32} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-plaza-ink truncate">{g.name}</span>
                      {g.server ? (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-plaza-accent-soft text-plaza-accent">{g.server}</span>
                      ) : null}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-plaza-ink-dim mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: grade.color }} />
                      {grade.label} · {g.memberCount}명
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-plaza-ink">{formatNumber(g.exp)}</span>
                    <span className="text-[9px] text-plaza-ink-dim ml-0.5">EXP</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {selected ? (
        <RankingModal
          guild={selected.guild}
          rank={selected.rank}
          isLoggedIn={isLoggedIn}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
