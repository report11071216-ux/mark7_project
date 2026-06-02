// components/plaza/PodiumTop3.tsx
"use client";

import Link from "next/link";
import { Crown, Medal, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export type RankedGuild = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  member_count: number | null;
  master_name: string | null;
  points: number;
  server?: string | null;
  exp?: number | null;
};

// 등급 8단계 (누적 경험치 기준)
export function getGuildGrade(exp: number): { name: string; tone: string } {
  if (exp >= 12000) return { name: "그랜드마스터", tone: "pink" };
  if (exp >= 6000) return { name: "마스터", tone: "violet" };
  if (exp >= 3000) return { name: "다이아", tone: "blue" };
  if (exp >= 1500) return { name: "에메랄드", tone: "emerald" };
  if (exp >= 700) return { name: "플래티넘", tone: "teal" };
  if (exp >= 300) return { name: "골드", tone: "yellow" };
  if (exp >= 100) return { name: "실버", tone: "slate" };
  return { name: "브론즈", tone: "bronze" };
}

// 다크(포디움)용 등급 뱃지 색
export const GRADE_BADGE_DARK: { [key: string]: { bg: string; color: string } } = {
  bronze: { bg: "#431407", color: "#fdba74" },
  slate: { bg: "#334155", color: "#cbd5e1" },
  yellow: { bg: "#422006", color: "#fde047" },
  teal: { bg: "#134e4a", color: "#5eead4" },
  emerald: { bg: "#064e3b", color: "#6ee7b7" },
  blue: { bg: "#1e3a8a", color: "#bfdbfe" },
  violet: { bg: "#4c1d95", color: "#ddd6fe" },
  pink: { bg: "#831843", color: "#fbcfe8" },
};

// 라이트(리스트)용 등급 뱃지 색
export const GRADE_BADGE_LIGHT: { [key: string]: { bg: string; color: string } } = {
  bronze: { bg: "#fef3e2", color: "#b45309" },
  slate: { bg: "#f1f5f9", color: "#475569" },
  yellow: { bg: "#fef9c3", color: "#a16207" },
  teal: { bg: "#ccfbf1", color: "#0f766e" },
  emerald: { bg: "#ecfdf5", color: "#059669" },
  blue: { bg: "#dbeafe", color: "#1d4ed8" },
  violet: { bg: "#f5f3ff", color: "#7c3aed" },
  pink: { bg: "#fce7f3", color: "#be185d" },
};

type RankStyle = {
  label: string;
  pillBg: string;
  pillColor: string;
  cardBorder: string;
  markRing: string;
  expColor: string;
};

const RANK_STYLES: { [key: string]: RankStyle } = {
  "1": { label: "CHAMPION", pillBg: "#fef9c3", pillColor: "#a16207", cardBorder: "2px solid #facc15", markRing: "#facc15", expColor: "#fde047" },
  "2": { label: "RANK 2", pillBg: "#e2e8f0", pillColor: "#475569", cardBorder: "1px solid #334155", markRing: "#94a3b8", expColor: "#f8fafc" },
  "3": { label: "RANK 3", pillBg: "#fde9d0", pillColor: "#b45309", cardBorder: "1px solid #334155", markRing: "#f59e0b", expColor: "#f8fafc" },
};

export default function PodiumTop3({ guilds, metricLabel }: { guilds: RankedGuild[]; metricLabel: string }) {
  const first = guilds[0];
  const second = guilds[1];
  const third = guilds[2];
  return (
    <div className="grid grid-cols-3 gap-2.5 items-end mb-7">
      <PodiumCard guild={second} rank={2} metricLabel={metricLabel} />
      <PodiumCard guild={first} rank={1} metricLabel={metricLabel} />
      <PodiumCard guild={third} rank={3} metricLabel={metricLabel} />
    </div>
  );
}

function PodiumCard({ guild, rank, metricLabel }: { guild: RankedGuild | undefined; rank: 1 | 2 | 3; metricLabel: string }) {
  if (!guild) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400 text-xs">—</div>
      </div>
    );
  }

  const s = RANK_STYLES[String(rank)];
  const isFirst = rank === 1;
  const grade = getGuildGrade(guild.exp ?? guild.points);
  const gradeStyle = GRADE_BADGE_DARK[grade.tone];
  const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Award;

  return (
    <Link href={`/guild/${guild.code}`} className="block group">
      <div className="flex flex-col items-center">
        <div className="mb-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ background: s.pillBg, color: s.pillColor }}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono font-medium">{s.label}</span>
        </div>

        <div className="w-full rounded-2xl p-3 text-center transition group-hover:-translate-y-0.5" style={{ background: "#0f172a", border: s.cardBorder }}>
          <div className="w-full mb-2.5 rounded-xl overflow-hidden" style={{ aspectRatio: "1 / 1", border: `2px solid ${s.markRing}`, background: "#1e293b" }}>
            {guild.logo_url ? (
              <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-medium" style={{ color: s.markRing, fontSize: isFirst ? 48 : 36 }}>
                {guild.name.charAt(0)}
              </div>
            )}
          </div>

          <p className="font-medium text-white truncate" style={{ fontSize: isFirst ? 18 : 15 }}>{guild.name}</p>

          <div className="flex gap-1 justify-center my-2 flex-wrap">
            {guild.server && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#164e63", color: "#67e8f9" }}>{guild.server}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: gradeStyle.bg, color: gradeStyle.color }}>{grade.name}</span>
          </div>

          <p className="font-medium" style={{ fontSize: isFirst ? 26 : 19, color: s.expColor }}>{formatNumber(guild.points)}</p>
          <p className="text-[10px] font-mono text-slate-500">{metricLabel} · {guild.member_count ?? 0}명</p>
        </div>
      </div>
    </Link>
  );
}
