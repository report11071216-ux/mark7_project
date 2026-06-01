export type GuildGrade = {
  key: string;
  label: string;
  minExp: number;     // 이 등급 도달에 필요한 누적 경험치
  color: string;      // 메인 색 (hex)
  icon: string;       // lucide 아이콘 이름
};

// 등급 곡선 (누적 경험치 기준) — 0/100/300/700/1500/3000/6000/12000
export const GUILD_GRADES: GuildGrade[] = [
  { key: "bronze",      label: "브론즈",      minExp: 0,     color: "#b45309", icon: "Award" },
  { key: "silver",      label: "실버",        minExp: 100,   color: "#64748b", icon: "Award" },
  { key: "gold",        label: "골드",        minExp: 300,   color: "#ca8a04", icon: "Award" },
  { key: "platinum",    label: "플래티넘",    minExp: 700,   color: "#7c3aed", icon: "Gem" },
  { key: "emerald",     label: "에메랄드",    minExp: 1500,  color: "#0f766e", icon: "Gem" },
  { key: "diamond",     label: "다이아몬드",  minExp: 3000,  color: "#0369a1", icon: "Gem" },
  { key: "master",      label: "마스터",      minExp: 6000,  color: "#b91c1c", icon: "Crown" },
  { key: "grandmaster", label: "그랜드마스터", minExp: 12000, color: "#4c1d95", icon: "Crown" },
];

// 구매 비용 정책
export const GUILD_COSTS = {
  member: 200,   // 인원 +1
  vault: 200,    // 보관함 +1
  expUnit: 100,  // 경험치 1회 구매 단위 (100P = 경험치 10)
};
export const EXP_PER_UNIT = 10; // 100P 당 경험치 10

// 누적 경험치 → 현재 등급
export function getGuildGrade(totalExp: number): GuildGrade {
  let current = GUILD_GRADES[0];
  for (const g of GUILD_GRADES) {
    if (totalExp >= g.minExp) current = g;
  }
  return current;
}

// 다음 등급 (없으면 null = 최고 등급)
export function getNextGrade(totalExp: number): GuildGrade | null {
  for (const g of GUILD_GRADES) {
    if (totalExp < g.minExp) return g;
  }
  return null;
}

// 현재 등급 구간 내 진행률 (0~100)
export function getGradeProgress(totalExp: number): {
  current: GuildGrade;
  next: GuildGrade | null;
  percent: number;
  curExp: number;     // 현재 등급 시작점부터 쌓인 경험치
  needExp: number;    // 다음 등급까지 필요한 총 경험치 구간
} {
  const current = getGuildGrade(totalExp);
  const next = getNextGrade(totalExp);
  if (!next) {
    return { current, next: null, percent: 100, curExp: totalExp - current.minExp, needExp: 0 };
  }
  const span = next.minExp - current.minExp;
  const into = totalExp - current.minExp;
  const percent = span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0;
  return { current, next, percent, curExp: into, needExp: span };
}
