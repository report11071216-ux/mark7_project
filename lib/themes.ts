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

export type ThemeWidget = {
  id: WidgetId;
  wide: boolean;
  enabled: boolean;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: ThemeWidget[];
};

export const WIDGET_META: { [key: string]: { label: string; icon: string; description: string } } = {
  attendance:    { label: "출석 체크",    icon: "✅", description: "오늘의 출석 + 연속 출석" },
  calendar:      { label: "출석 캘린더",  icon: "📅", description: "월/주/일 출석 현황" },
  stats:         { label: "길드 통계",    icon: "📊", description: "멤버·포인트·출석 수치" },
  recentMembers: { label: "최근 가입",    icon: "👥", description: "최근 가입한 멤버 목록" },
  notice:        { label: "공지사항",     icon: "📢", description: "최근 공지 5개" },
  guildIntro:    { label: "길드 소개",    icon: "🏰", description: "길드 정보·환영 메시지" },
  pointRanking:  { label: "포인트 랭킹", icon: "🏆", description: "길드 내 포인트 TOP 10" },
  guardian:      { label: "가디언 토벌", icon: "⚔️", description: "이번 주 가디언 정보" },
  raidStatus:    { label: "레이드 현황", icon: "🗡️", description: "예정된 레이드 일정" },
  onlineMembers: { label: "온라인 멤버", icon: "🟢", description: "현재 접속 중인 멤버" },
};

export const THEMES: Theme[] = [
  {
    id: "conquest",
    name: "Conquest",
    description: "정복자. 출석·랭킹 강조",
    icon: "⚔️",
    widgets: [
      { id: "stats",         wide: true,  enabled: true },
      { id: "attendance",    wide: false, enabled: true },
      { id: "calendar",      wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "guardian",      wide: false, enabled: true },
    ],
  },
  {
    id: "sanctuary",
    name: "Sanctuary",
    description: "커뮤니티. 공지·멤버 중심",
    icon: "🏛️",
    widgets: [
      { id: "guildIntro",    wide: false, enabled: true },
      { id: "notice",        wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "attendance",    wide: true,  enabled: true },
    ],
  },
  {
    id: "raid",
    name: "Raid",
    description: "레이드 특화. 일정·현황",
    icon: "🗡️",
    widgets: [
      { id: "raidStatus",  wide: true,  enabled: true },
      { id: "guardian",    wide: false, enabled: true },
      { id: "attendance",  wide: false, enabled: true },
      { id: "stats",       wide: true,  enabled: true },
    ],
  },
  {
    id: "honor",
    name: "Honor",
    description: "명예. 포인트 랭킹 강조",
    icon: "🏆",
    widgets: [
      { id: "pointRanking", wide: true,  enabled: true },
      { id: "stats",        wide: false, enabled: true },
      { id: "attendance",   wide: false, enabled: true },
      { id: "calendar",     wide: true,  enabled: true },
    ],
  },
  {
    id: "compact",
    name: "Compact",
    description: "미니멀. 핵심만",
    icon: "📦",
    widgets: [
      { id: "attendance", wide: false, enabled: true },
      { id: "stats",      wide: false, enabled: true },
      { id: "notice",     wide: true,  enabled: true },
    ],
  },
  {
    id: "chronicle",
    name: "Chronicle",
    description: "기록. 캘린더·히스토리",
    icon: "📅",
    widgets: [
      { id: "calendar",      wide: true,  enabled: true },
      { id: "attendance",    wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "recentMembers", wide: true,  enabled: true },
    ],
  },
  {
    id: "fortress",
    name: "Fortress",
    description: "요새. 멤버·온라인",
    icon: "🏰",
    widgets: [
      { id: "onlineMembers", wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "stats",         wide: true,  enabled: true },
      { id: "guildIntro",    wide: true,  enabled: true },
    ],
  },
  {
    id: "vanguard",
    name: "Vanguard",
    description: "선봉대. 레이드·가디언",
    icon: "🛡️",
    widgets: [
      { id: "raidStatus",   wide: false, enabled: true },
      { id: "guardian",     wide: false, enabled: true },
      { id: "pointRanking", wide: false, enabled: true },
      { id: "stats",        wide: false, enabled: true },
      { id: "attendance",   wide: true,  enabled: true },
    ],
  },
  {
    id: "harmony",
    name: "Harmony",
    description: "균형. 모든 위젯 고르게",
    icon: "☯️",
    widgets: [
      { id: "attendance",    wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "notice",        wide: false, enabled: true },
      { id: "calendar",      wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "guardian",      wide: true,  enabled: true },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    description: "직접 구성",
    icon: "✨",
    widgets: [
      { id: "attendance",    wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "notice",        wide: false, enabled: true },
      { id: "calendar",      wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "guardian",      wide: true,  enabled: true },
    ],
  },
];

export function getTheme(themeId: string | null | undefined): Theme {
  if (!themeId) return THEMES[0];
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

export function getLayoutWidgets(layoutConfig: { theme?: string; custom?: boolean; widgets?: ThemeWidget[] }): ThemeWidget[] {
  if (layoutConfig.custom && Array.isArray(layoutConfig.widgets)) {
    return layoutConfig.widgets.filter((w) => w.enabled);
  }
  const theme = getTheme(layoutConfig.theme);
  return theme.widgets.filter((w) => w.enabled);
}
