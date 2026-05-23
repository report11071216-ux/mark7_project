export type WidgetId =
  | "attendance" | "calendar" | "stats" | "recentMembers"
  | "notice" | "guildIntro" | "pointRanking" | "guardian"
  | "raidStatus" | "onlineMembers";

export type ThemeWidget = { id: WidgetId; wide: boolean; enabled: boolean };

export type LayoutStyle = "naver" | "discord" | "notion" | "steam";

export type Theme = {
  id: string;
  name: string;
  description: string;
  icon: string;
  layoutStyle: LayoutStyle;
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
    id: "naver",
    name: "네이버 카페",
    description: "포털 카페 스타일. 공지·랭킹 중심",
    icon: "🟢",
    layoutStyle: "naver",
    widgets: [
      { id: "notice",        wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "attendance",    wide: false, enabled: true },
      { id: "guardian",      wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "onlineMembers", wide: false, enabled: true },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "채널 기반 다크 커뮤니티",
    icon: "💬",
    layoutStyle: "discord",
    widgets: [
      { id: "attendance",    wide: false, enabled: true },
      { id: "stats",         wide: false, enabled: true },
      { id: "notice",        wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "guardian",      wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
      { id: "onlineMembers", wide: false, enabled: true },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    description: "미니멀 대시보드. 정보 중심",
    icon: "📋",
    layoutStyle: "notion",
    widgets: [
      { id: "stats",         wide: true,  enabled: true },
      { id: "attendance",    wide: false, enabled: true },
      { id: "calendar",      wide: false, enabled: true },
      { id: "notice",        wide: true,  enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
    ],
  },
  {
    id: "steam",
    name: "Steam",
    description: "게이밍 스타일. 배너·스탯 강조",
    icon: "🎮",
    layoutStyle: "steam",
    widgets: [
      { id: "attendance",    wide: false, enabled: true },
      { id: "pointRanking",  wide: false, enabled: true },
      { id: "guardian",      wide: true,  enabled: true },
      { id: "stats",         wide: true,  enabled: true },
      { id: "notice",        wide: false, enabled: true },
      { id: "recentMembers", wide: false, enabled: true },
    ],
  },
];

export function getTheme(themeId: string | null | undefined): Theme {
  if (!themeId) return THEMES[0];
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

export function getLayoutWidgets(layoutConfig: {
  theme?: string;
  custom?: boolean;
  widgets?: ThemeWidget[];
}): ThemeWidget[] {
  if (layoutConfig.custom && Array.isArray(layoutConfig.widgets)) {
    return layoutConfig.widgets.filter((w) => w.enabled);
  }
  const theme = getTheme(layoutConfig.theme);
  return theme.widgets.filter((w) => w.enabled);
}
