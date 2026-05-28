import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type LayoutColumns } from "@/lib/guild-layout-config";
import { formatNumber } from "@/lib/utils";
import WidgetRenderer, { type WidgetColors } from "@/components/guild/WidgetRenderer";
import ShowcaseUploadModal from "@/components/guild/ShowcaseUploadModal";

type Props = {
  data: GuildLayoutData;
  guildCode: string;
  columns: LayoutColumns;
  isStaff?: boolean;
  showcaseUploadedToday?: boolean;
};

function isLightColor(hex: string) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function GuildHomeLayout({
  data,
  guildCode,
  columns,
  isStaff,
  showcaseUploadedToday,
}: Props) {
  const { guild, totalAttendances, streak, primaryColor, backgroundColor } = data;

  const isLight = isLightColor(backgroundColor);
  const textPrimary = isLight ? "#111827" : "#ffffff";
  const textSecondary = isLight ? "#6b7280" : "#a1a1aa";
  const cardBg = isLight ? "#ffffff" : "#18181b";
  const cardBorder = isLight ? "#e5e7eb" : "#27272a";
  const dividerColor = isLight ? "#f3f4f6" : "#27272a";

  const colors: WidgetColors = {
    textPrimary: textPrimary,
    textSecondary: textSecondary,
    cardBg: cardBg,
    cardBorder: cardBorder,
    dividerColor: dividerColor,
    primaryColor: primaryColor,
  };

  const tabs = [
    { label: "홈", href: `/guild/${guildCode}` },
    { label: "공지", href: `/guild/${guildCode}/posts` },
    { label: "멤버", href: null },
    { label: "랭킹", href: null },
    { label: "레이드", href: `/guild/${guildCode}/raids` },
  ];

  function renderColumn(items: { id: string }[]) {
    return items.map((w) => (
      <WidgetRenderer
        key={w.id}
        widgetId={w.id as any}
        data={data}
        guildCode={guildCode}
        colors={colors}
      />
    ));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="border-b shadow-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
              {guild.logo_url
                ? <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{guild.name?.[0] ?? "G"}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-lg font-bold leading-tight truncate" style={{ color: textPrimary }}>{guild.name}</h1>
                {guild.server ? (
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: primaryColor + "22", color: primaryColor }}
                  >
                    [{guild.server}]
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] font-mono" style={{ color: primaryColor }}>{guild.code}</p>
            </div>
            <div className="hidden sm:flex items-center gap-6 ml-auto">
              {[
                { label: "멤버", value: `${guild.member_count}/${guild.max_members}`, color: textPrimary },
                { label: "포인트", value: formatNumber(guild.total_points), color: primaryColor },
                { label: "내 출석", value: `${totalAttendances}일`, color: textPrimary },
                { label: "연속", value: `${streak}일`, color: textPrimary },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] uppercase" style={{ color: textSecondary }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex" style={{ borderTopColor: cardBorder, borderTopWidth: 1 }}>
            {tabs.map((tab, i) =>
              tab.href ? (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="px-5 py-2.5 text-sm font-medium cursor-pointer border-b-2 transition-colors"
                  style={{
                    borderBottomColor: i === 0 ? primaryColor : "transparent",
                    color: i === 0 ? primaryColor : textSecondary,
                  }}
                >
                  {tab.label}
                </Link>
              ) : (
                <div
                  key={tab.label}
                  className="px-5 py-2.5 text-sm font-medium border-b-2 cursor-default"
                  style={{ borderBottomColor: "transparent", color: textSecondary, opacity: 0.4 }}
                >
                  {tab.label}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4 items-start">
        <div className="w-full lg:w-[252px] shrink-0 space-y-3">
          {renderColumn(columns.left)}
        </div>
        <div className="w-full flex-1 min-w-0 space-y-3">
          {renderColumn(columns.center)}
        </div>
        <div className="w-full lg:w-[252px] shrink-0 space-y-3">
          {renderColumn(columns.right)}
        </div>
      </div>

      {isStaff && (
        <>
          <Link
            href={`/guild/${guildCode}/customize`}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-105 active:scale-95"
          >
            홈 편집
          </Link>
          <ShowcaseUploadModal
            guildCode={guildCode}
            alreadyToday={showcaseUploadedToday ?? false}
          />
        </>
      )}
    </div>
  );
}
