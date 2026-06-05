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
  const { guild, totalAttendances, streak, primaryColor, backgroundColor, bannerUrl } = data;
  const equippedBackgroundUrl = (data as any).equippedBackgroundUrl ?? null;
  const cardStyle = (data as any).cardStyle ?? "solid";
  const hasBg = !!equippedBackgroundUrl;

  const effectiveStyle = hasBg ? cardStyle : "solid";
  const isGlassLight = effectiveStyle === "glass-light";
  const isGlassDark = effectiveStyle === "glass-dark";
  const isGlass = isGlassLight || isGlassDark;

  let textPrimary: string;
  let textSecondary: string;
  let cardBg: string;
  let cardBorder: string;
  let dividerColor: string;
  let headerBg: string;

  if (isGlassDark) {
    textPrimary = "#f1f5f9";
    textSecondary = "#cbd5e1";
    // blur 없이 반투명만 — 가독성 위해 좀 더 진하게
    cardBg = "rgba(20,28,44,0.86)";
    cardBorder = "rgba(255,255,255,0.14)";
    dividerColor = "rgba(255,255,255,0.10)";
    headerBg = "rgba(20,28,44,0.9)";
  } else if (isGlassLight) {
    textPrimary = "#1a2332";
    textSecondary = "#475569";
    cardBg = "rgba(255,255,255,0.9)";
    cardBorder = "rgba(255,255,255,0.7)";
    dividerColor = "rgba(0,0,0,0.06)";
    headerBg = "rgba(255,255,255,0.92)";
  } else {
    const isLight = isLightColor(backgroundColor);
    textPrimary = isLight ? "#111827" : "#ffffff";
    textSecondary = isLight ? "#6b7280" : "#a1a1aa";
    cardBg = isLight ? "#ffffff" : "#18181b";
    cardBorder = isLight ? "#e5e7eb" : "#27272a";
    dividerColor = isLight ? "#f3f4f6" : "#27272a";
    headerBg = hasBg ? "rgba(255,255,255,0.9)" : cardBg;
  }

  const colors: WidgetColors = {
    textPrimary,
    textSecondary,
    cardBg,
    cardBorder,
    dividerColor,
    primaryColor,
  };

  const tabs = [
    { label: "홈", href: `/guild/${guildCode}` },
    { label: "게시판", href: `/guild/${guildCode}/posts` },
    { label: "멤버", href: `/guild/${guildCode}/members` },
    { label: "성장", href: `/guild/${guildCode}/growth` },
    { label: "랭킹", href: null },
    { label: "레이드", href: `/guild/${guildCode}/raids` },
    { label: "이벤트", href: `/guild/${guildCode}/events` },
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
    <div className="min-h-screen relative" style={hasBg ? undefined : { backgroundColor }}>
      {/* 배경 이미지 레이어 */}
      {hasBg && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src={equippedBackgroundUrl}
            alt=""
            className="w-full object-cover"
            style={{ position: "sticky", top: 0, height: "100vh" }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isGlassDark
                ? "rgba(10,15,25,0.45)"
                : isGlassLight
                ? "rgba(241,245,249,0.35)"
                : "rgba(241,245,249,0.82)",
            }}
          />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10">
        {bannerUrl ? (
          <div className="w-full">
            <div className="max-w-[1200px] mx-auto px-4 pt-4">
              <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: cardBorder }}>
                <img src={bannerUrl} alt={`${guild.name} 배너`} className="w-full aspect-[16/5] max-h-[220px] object-cover" />
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="border-b shadow-sm"
          style={{
            backgroundColor: headerBg,
            borderColor: cardBorder,
          }}
        >
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center gap-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-lg font-bold leading-tight truncate" style={{ color: textPrimary }}>{guild.name}</h1>
                  {guild.server ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>
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

            <div className="flex overflow-x-auto" style={{ borderTopColor: cardBorder, borderTopWidth: 1 }}>
              {tabs.map((tab, i) =>
                tab.href ? (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className="px-5 py-2.5 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap"
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
                    className="px-5 py-2.5 text-sm font-medium border-b-2 cursor-default whitespace-nowrap"
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
