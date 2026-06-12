export type AchievementKind = "member" | "attendance" | "grade";

export type Achievement = {
  key: string;          // member_50, attendance_1000, grade_silver
  kind: AchievementKind;
  threshold: number;    // 달성 기준 (등급은 필요 exp)
  label: string;        // "길드원 50명"
  desc: string;         // "길드원이 50명에 도달"
  guildReward: number;  // 길드 포인트
  personalReward: number; // 개인 포인트
};

const MEMBER_STEPS = [5, 10, 20, 30, 40, 50, 70, 100, 150, 200];
const ATTENDANCE_STEPS = [30, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 5000];

// 등급: key suffix → 필요 exp (RPC와 동일하게 유지)
const GRADE_STEPS: { suffix: string; exp: number; label: string }[] = [
  { suffix: "silver", exp: 100, label: "실버" },
  { suffix: "gold", exp: 300, label: "골드" },
  { suffix: "platinum", exp: 700, label: "플래티넘" },
  { suffix: "emerald", exp: 1500, label: "에메랄드" },
  { suffix: "diamond", exp: 3000, label: "다이아몬드" },
  { suffix: "master", exp: 6000, label: "마스터" },
  { suffix: "grandmaster", exp: 12000, label: "그랜드마스터" },
];

const GUILD_REWARD = 100;
const PERSONAL_REWARD = 50;

export const MEMBER_ACHIEVEMENTS: Achievement[] = MEMBER_STEPS.map((n) => ({
  key: `member_${n}`,
  kind: "member",
  threshold: n,
  label: `길드원 ${n}명`,
  desc: `길드원이 ${n}명에 도달`,
  guildReward: GUILD_REWARD,
  personalReward: PERSONAL_REWARD,
}));

export const ATTENDANCE_ACHIEVEMENTS: Achievement[] = ATTENDANCE_STEPS.map((n) => ({
  key: `attendance_${n}`,
  kind: "attendance",
  threshold: n,
  label: `누적 출석 ${n.toLocaleString()}회`,
  desc: `길드원 전체 누적 출석 ${n.toLocaleString()}회`,
  guildReward: GUILD_REWARD,
  personalReward: PERSONAL_REWARD,
}));

export const GRADE_ACHIEVEMENTS: Achievement[] = GRADE_STEPS.map((g) => ({
  key: `grade_${g.suffix}`,
  kind: "grade",
  threshold: g.exp,
  label: `${g.label} 등급 달성`,
  desc: `길드 경험치 ${g.exp.toLocaleString()} 도달`,
  guildReward: GUILD_REWARD,
  personalReward: PERSONAL_REWARD,
}));

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...MEMBER_ACHIEVEMENTS,
  ...ATTENDANCE_ACHIEVEMENTS,
  ...GRADE_ACHIEVEMENTS,
];

// 현재 값 기준으로 달성 여부
export function isAchieved(a: Achievement, current: { memberCount: number; attendanceCount: number; totalExp: number }): boolean {
  if (a.kind === "member") return current.memberCount >= a.threshold;
  if (a.kind === "attendance") return current.attendanceCount >= a.threshold;
  if (a.kind === "grade") return current.totalExp >= a.threshold;
  return false;
}

// 진행도 (0~1)
export function progressOf(a: Achievement, current: { memberCount: number; attendanceCount: number; totalExp: number }): number {
  let cur = 0;
  if (a.kind === "member") cur = current.memberCount;
  else if (a.kind === "attendance") cur = current.attendanceCount;
  else if (a.kind === "grade") cur = current.totalExp;
  if (a.threshold <= 0) return 1;
  return Math.min(1, cur / a.threshold);
}

// 진행도 텍스트
export function progressText(a: Achievement, current: { memberCount: number; attendanceCount: number; totalExp: number }): string {
  let cur = 0;
  if (a.kind === "member") cur = current.memberCount;
  else if (a.kind === "attendance") cur = current.attendanceCount;
  else if (a.kind === "grade") cur = current.totalExp;
  return `${cur.toLocaleString()} / ${a.threshold.toLocaleString()}`;
}
