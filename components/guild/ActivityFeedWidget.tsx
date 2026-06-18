import { Activity, CalendarCheck, Swords, UserPlus } from "lucide-react";
import { type ActivityFeedItem } from "@/lib/guild-layout-types";
import { type WidgetColors } from "@/components/guild/WidgetRenderer";
import { getRelativeTime } from "@/lib/utils";

type Props = {
  items: ActivityFeedItem[];
  colors: WidgetColors;
};

function iconFor(kind: ActivityFeedItem["kind"]) {
  if (kind === "raidClear") return Swords;
  if (kind === "join") return UserPlus;
  return CalendarCheck;
}

// 활동 종류별 색 (출석=초록, 레이드=보라(테마색), 가입=앰버)
function tintFor(kind: ActivityFeedItem["kind"], primaryColor: string) {
  if (kind === "raidClear") return { fg: primaryColor, bg: primaryColor + "22" };
  if (kind === "join") return { fg: "#d97706", bg: "#d977061f" };
  return { fg: "#16a34a", bg: "#16a34a1f" };
}

function lineOf(item: ActivityFeedItem, accent: string, textPrimary: string) {
  const strong = (
    <span style={{ color: item.kind === "raidClear" ? accent : textPrimary, fontWeight: 600 }}>
      {item.name}
    </span>
  );
  if (item.kind === "raidClear") return <>{strong} 클리어!</>;
  if (item.kind === "join") return <>{strong}님이 길드에 가입했어요</>;
  return <>{strong}님이 출석했어요</>;
}

export default function ActivityFeedWidget({ items, colors }: Props) {
  const { textPrimary, textSecondary, cardBg, cardBorder, dividerColor, primaryColor } = colors;
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <Activity className="w-4 h-4" style={{ color: primaryColor }} />
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>길드 활동</h2>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: textSecondary }}>
          아직 활동이 없어요
        </p>
      ) : (
        <div className="p-1.5">
          {list.map((item, i) => {
            const Icon = iconFor(item.kind);
            const tint = tintFor(item.kind, primaryColor);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                style={{ backgroundColor: i % 2 === 1 ? dividerColor : "transparent" }}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                  style={{ backgroundColor: tint.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: tint.fg }} />
                </span>
                <p className="flex-1 min-w-0 text-xs truncate" style={{ color: textSecondary }}>
                  {lineOf(item, primaryColor, textPrimary)}
                </p>
                <span className="text-[10px] shrink-0" style={{ color: textSecondary }}>
                  {getRelativeTime(item.at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
