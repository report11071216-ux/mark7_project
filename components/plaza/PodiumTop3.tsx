// components/plaza/PodiumTop3.tsx
"use client";

import Link from "next/link";
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

// 등급 점(dot) 색
const GRADE_DOT: { [key: string]: string } = {
  bronze: "#d6a06a",
  slate: "#94a3b8",
  yellow: "#eab308",
  teal: "#14b8a6",
  emerald: "#10b981",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  pink: "#ec4899",
};

// 라이트(리스트)용 등급 뱃지 색 — RankingList.tsx가 import해서 씀
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
  numColor: string;
  labelColor: string;
  cardBorder: string;
  cardShadow: string;
  markBg: string;
  markIconColor: string;
  serverChipColor: string;
  expColor: string;
  expUnitColor: string;
  nameColor: string;
  numSize: number;
  numWeight: number;
  marginTop: number;
};

const RANK_STYLES: { [key: string]: RankStyle } = {
  "1": {
    label: "First",
    numColor: "#fbbf24",
    labelColor: "#d97706",
    cardBorder: "1px solid rgba(251,191,36,0.5)",
    cardShadow: "0 0 0 1px rgba(251,191,36,0.12), 0 18px 50px -12px rgba(251,191,36,0.35)",
    markBg: "#1a1206",
    markIconColor: "#fbbf24",
    serverChipColor: "#fde68a",
    expColor: "#fbbf24",
    expUnitColor: "#92400e",
    nameColor: "#ffffff",
    numSize: 32,
    numWeight: 700,
    marginTop: 0,
  },
  "2": {
    label: "Second",
    numColor: "#94a3b8",
    labelColor: "#94a3b8",
    cardBorder: "1px solid rgba(148,163,184,0.22)",
    cardShadow: "none",
    markBg: "#161f33",
    markIconColor: "#94a3b8",
    serverChipColor: "#cbd5e1",
    expColor: "#f8fafc",
    expUnitColor: "#475569",
    nameColor: "#f1f5f9",
    numSize: 26,
    numWeight: 600,
    marginTop: 34,
  },
  "3": {
    label: "Third",
    numColor: "#d6a06a",
    labelColor: "#b45309",
    cardBorder: "1px solid rgba(217,119,6,0.28)",
    cardShadow: "none",
    markBg: "#1c1408",
    markIconColor: "#d6a06a",
    serverChipColor: "#fcd9a6",
    expColor: "#f8fafc",
    expUnitColor: "#475569",
    nameColor: "#f1f5f9",
    numSize: 26,
    numWeight: 600,
    marginTop: 34,
  },
};

export default function PodiumTop3({ guilds, metricLabel }: { guilds: RankedGuild[]; metricLabel: string }) {
  const first = guilds[0];
  const second = guilds[1];
  const third = guilds[2];
  return (
    <div className="grid gap-3.5 items-start mb-7" style={{ gridTemplateColumns: "1fr 1.12fr 1fr" }}>
      <PodiumCard guild={second} rank={2} />
      <PodiumCard guild={first} rank={1} />
      <PodiumCard guild={third} rank={3} />
    </div>
  );
}

function PodiumCard({ guild, rank }: { guild: RankedGuild | undefined; rank: 1 | 2 | 3 }) {
  const s = RANK_STYLES[String(rank)];

  if (!guild) {
    return (
      <div style={{ marginTop: s.marginTop }}>
        <div className="rounded-[22px] border border-dashed border-slate-300 text-center text-slate-400 text-xs flex items-center justify-center" style={{ aspectRatio: "1 / 1.35" }}>
          —
        </div>
      </div>
    );
  }

  const isFirst = rank === 1;
  const grade = getGuildGrade(guild.exp ?? guild.points);
  const dotColor = GRADE_DOT[grade.tone];

  return (
    <Link href={`/guild/${guild.code}`} className="block group">
      <div style={{ marginTop: s.marginTop }}>
        {/* 순위 숫자 + 라벨 */}
        <div className="flex items-baseline gap-[7px] px-1 pb-2">
          <span style={{ fontSize: s.numSize, fontWeight: s.numWeight, color: s.numColor, lineHeight: 1 }}>{rank}</span>
          <span style={{ fontSize: 12, fontWeight: isFirst ? 600 : 500, color: s.labelColor }}>{s.label}</span>
        </div>

        {/* 카드 */}
        <div
          className="transition group-hover:-translate-y-0.5"
          style={{ background: "#0d1426", border: s.cardBorder, borderRadius: isFirst ? 24 : 22, padding: isFirst ? 14 : 12, boxShadow: s.cardShadow }}
        >
          {/* 마크 */}
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1 / 1", borderRadius: isFirst ? 18 : 16, background: s.markBg }}>
            {guild.logo_url ? (
              <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: s.markIconColor, fontSize: isFirst ? 56 : 40 }}>
                {guild.name.charAt(0)}
              </div>
            )}
            {guild.server && (
              <span
                className="absolute"
                style={{ left: isFirst ? 10 : 9, bottom: isFirst ? 10 : 9, fontSize: 10, color: s.serverChipColor, background: "rgba(2,6,23,0.55)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 6 }}
              >
                {guild.server}
              </span>
            )}
          </div>

          {/* 본문 */}
          <div style={{ padding: isFirst ? "14px 4px 4px" : "12px 4px 4px" }}>
            <p className="truncate" style={{ fontSize: isFirst ? 18 : 15, fontWeight: isFirst ? 700 : 600, color: s.nameColor, margin: "0 0 9px" }}>
              {guild.name}
            </p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-[5px]">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
                <span style={{ fontSize: 12, color: isFirst ? "#cbd5e1" : "#94a3b8" }}>{grade.name}</span>
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{guild.member_count ?? 0}명</span>
            </div>
            <div className="flex items-baseline gap-[5px]" style={{ marginTop: isFirst ? 11 : 10, paddingTop: isFirst ? 11 : 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: isFirst ? 26 : 20, fontWeight: isFirst ? 700 : 600, color: s.expColor }}>{formatNumber(guild.points)}</span>
              <span style={{ fontSize: 11, color: s.expUnitColor }}>EXP</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
