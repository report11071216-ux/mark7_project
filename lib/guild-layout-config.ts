import { type WidgetId } from "@/lib/themes";

export type LayoutColumnKey = "left" | "center" | "right";

export type LayoutWidget = { id: WidgetId };

export type LayoutColumns = {
  left: LayoutWidget[];
  center: LayoutWidget[];
  right: LayoutWidget[];
};

// 위젯 빌더 저장 포맷 (version 2)
export type LayoutConfigV2 = {
  version: 2;
  columns: LayoutColumns;
};

// 빌더로 한 번도 저장 안 한 길드 / 옛 포맷 길드의 기본 배치
export const DEFAULT_LAYOUT: LayoutColumns = {
  left: [{ id: "pointRanking" }, { id: "onlineMembers" }, { id: "calendar" }],
  center: [
    { id: "notice" },
    { id: "raidSchedule" },
    { id: "raidCalendar" },
    { id: "guardian" },
    { id: "recentMembers" },
  ],
  right: [{ id: "attendance" }, { id: "raidStatus" }, { id: "stats" }],
};

const VALID_IDS: WidgetId[] = [
  "attendance", "calendar", "stats", "recentMembers",
  "notice", "guildIntro", "pointRanking", "guardian",
  "raidStatus", "onlineMembers", "raidSchedule", "raidCalendar",
];

function cleanColumn(arr: any): LayoutWidget[] {
  if (!Array.isArray(arr)) return [];
  const out: LayoutWidget[] = [];
  for (const item of arr) {
    const id = item && typeof item === "object" ? item.id : item;
    if (typeof id === "string" && VALID_IDS.indexOf(id as WidgetId) !== -1) {
      out.push({ id: id as WidgetId });
    }
  }
  return out;
}

// guild_themes.layout_config 를 항상 안전한 컬럼 구조로 변환.
// version 2 가 아니면(옛 포맷) 기본 배치를 돌려줘서 기존 길드가 안 깨지게 함.
export function normalizeLayout(rawConfig: any): LayoutColumns {
  if (rawConfig && rawConfig.version === 2 && rawConfig.columns) {
    const seen = new Set<string>();
    const dedup = (arr: any): LayoutWidget[] => {
      const cleaned = cleanColumn(arr);
      const result: LayoutWidget[] = [];
      for (const w of cleaned) {
        if (seen.has(w.id)) continue;
        seen.add(w.id);
        result.push(w);
      }
      return result;
    };
    const c = rawConfig.columns;
    const left = dedup(c.left);
    const center = dedup(c.center);
    const right = dedup(c.right);
    if (left.length + center.length + right.length === 0) {
      return DEFAULT_LAYOUT;
    }
    return { left: left, center: center, right: right };
  }
  return DEFAULT_LAYOUT;
}
