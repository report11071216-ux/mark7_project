export type WidgetId =
  | "attendance"
  | "calendar"
  | "stats"
  | "recentMembers"
  | "notice"
  | "guildIntro"
  | "pointRanking"
  | "guardian"
  | "raidStatus"
  | "onlineMembers";

export type ThemeWidget = { id: WidgetId; wide: boolean };

export type Theme = {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: ThemeWidget[];
};

export const THEMES: Theme[] = [
  {
    id: "conquest",
    name: "Conquest",
    description: "정복자. 출석·랭킹 강조",
    icon: "⚔️",
    widgets: [
      { id: "stats", wide: true },
      { id: "attendance", wide: false },
      { id: "calendar", wide: false },
      { id: "pointRanking", wide: false },
      { id: "guardian", wide: false },
    ],
  },
  {
    id: "sanctuary",
    name: "Sanctuary",
    description: "커뮤니티. 공지·멤버 중심",
    icon: "🏛️",
    widgets: [
      { id: "guildIntro", wide: false },
      { id: "notice", wide: false },
      { id: "recentMembers", wide: false },
      { id: "stats", wide: false },
      { id: "attendance", wide: true },
    ],
  },
  {
    id: "raid",
    name: "Raid",
    description: "레이드 특화. 일정·현황",
    icon: "🗡️",
    widgets: [
      { id: "raidStatus", wide: true },
      { id: "guardian", wide: false },
      { id: "attendance", wide: false },
      { id: "stats", wide: true },
    ],
  },
  {
    id: "honor",
    name: "Honor",
    description: "명예. 포인트 랭킹 강조",
    icon: "🏆",
    widgets: [
      { id: "pointRanking", wide: true },
      { id: "stats", wide: false },
      { id: "attendance", wide: false },
      { id: "calendar", wide: true },
    ],
  },
  {
    id: "compact",
    name: "Compact",
    description: "미니멀. 핵심만",
    icon: "📦",
    widgets: [
      { id: "attendance", wide: false },
      { id: "stats", wide: false },
      { id: "notice", wide: true },
    ],
  },
  {
    id: "chronicle",
    name: "Chronicle",
    description: "기록. 캘린더·히스토리",
    icon: "📅",
    widgets: [
      { id: "calendar", wide: true },
      { id: "attendance", wide: false },
      { id: "stats", wide: false },
      { id: "recentMembers", wide: true },
    ],
  },
  {
    id: "fortress",
    name: "Fortress",
    description: "요새. 멤버·온라인",
    icon: "🏰",
    widgets: [
      { id: "onlineMembers", wide: false },
      { id: "recentMembers", wide: false },
      { id: "stats", wide: true },
      { id: "guildIntro", wide: true },
    ],
  },
  {
    id: "vanguard",
    name: "Vanguard",
    description: "선봉대. 레이드·가디언",
    icon: "🛡️",
    widgets: [
      { id: "raidStatus", wide: false },
      { id: "guardian", wide: false },
      { id: "pointRanking", wide: false },
      { id: "stats", wide: false },
      { id: "attendance", wide: true },
    ],
  },
  {
    id: "harmony",
    name: "Harmony",
    description: "균형. 모든 위젯 고르게",
    icon: "☯️",
    widgets: [
      { id: "attendance", wide: false },
      { id: "stats", wide: false },
      { id: "notice", wide: false },
      { id: "calendar", wide: false },
      { id: "pointRanking", wide: false },
      { id: "recentMembers", wide: false },
      { id: "guardian", wide: true },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    description: "자유 배치 (추후 지원)",
    icon: "✨",
    widgets: [
      { id: "attendance", wide: false },
      { id: "stats", wide: false },
      { id: "notice", wide: false },
      { id: "calendar", wide: false },
      { id: "pointRanking", wide: false },
      { id: "recentMembers", wide: false },
      { id: "guardian", wide: true },
    ],
  },
];

export function getTheme(themeId: string | null | undefined): Theme {
  if (!themeId) return THEMES[0];
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
