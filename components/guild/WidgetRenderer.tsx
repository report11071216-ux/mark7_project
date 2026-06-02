import Link from "next/link";
import { Bell, Swords } from "lucide-react";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type WidgetId } from "@/lib/themes";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import OnlineMembersCard from "@/components/guild/OnlineMembersCard";
import RankingCard from "@/components/guild/RankingCard";
import RecentMembersCard from "@/components/guild/RecentMembersCard";
import UpcomingRaidsWidget from "@/components/guild/UpcomingRaidsWidget";
import RaidMonthWidget from "@/components/guild/RaidMonthWidget";
import RaidActivityWidget from "@/components/guild/RaidActivityWidget";
import RaidStatusGalleryWidget from "@/components/guild/RaidStatusGalleryWidget";
import DiscordWidget from "@/components/guild/DiscordWidget";

const GUARDIAN_NAMES = ["루멘칼리고","가르가디스","스콜라키아","크라티오스","아게오로스","드렉탈라스","소나벨","베스칼"];

export type WidgetColors = {
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  dividerColor: string;
  primaryColor: string;
};

type Props = {
  widgetId: WidgetId;
  data: GuildLayoutData;
  guildCode: string;
  colors: WidgetColors;
};

export default function WidgetRenderer({ widgetId, data, guildCode, colors }: Props) {
  const { textPrimary, textSecondary, cardBg, cardBorder, dividerColor, primaryColor } = colors;
  const { guild } = data;

  if (widgetId === "pointRanking") {
    return (
      <RankingCard
        rankingMembers={data.rankingMembers}
        textPrimary={textPrimary}
        primaryColor={primaryColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
      />
    );
  }

  if (widgetId === "onlineMembers") {
    return (
      <OnlineMembersCard
        onlineMembers={data.onlineMembers}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        cardBg={cardBg}
        cardBorder={cardBorder}
        primaryColor={primaryColor}
      />
    );
  }

  if (widgetId === "recentMembers") {
    return (
      <RecentMembersCard
        recentMembers={data.recentMembers}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        primaryColor={primaryColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
        dividerColor={dividerColor}
      />
    );
  }

  if (widgetId === "calendar") {
    return <MiniCalendar attendanceDates={data.attendanceDates} />;
  }

  if (widgetId === "raidSchedule") {
    return (
      <UpcomingRaidsWidget
        guildId={guild.id}
        guildCode={guildCode}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        accent={primaryColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
        surface={dividerColor}
      />
    );
  }

  if (widgetId === "raidCalendar") {
    return (
      <RaidMonthWidget
        guildId={guild.id}
        guildCode={guildCode}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        accent={primaryColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
      />
    );
  }

  if (widgetId === "raidActivity") {
    return <RaidActivityWidget guildId={guild.id} colors={colors} />;
  }

  if (widgetId === "discord") {
    return (
      <DiscordWidget
        widgetId={guild.discord_widget_id ?? null}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    );
  }

  if (widgetId === "attendance") {
    return (
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="px-4 py-2.5" style={{ backgroundColor: primaryColor }}>
          <p className="text-xs font-bold text-white">오늘의 출석</p>
        </div>
        <div className="p-3">
          <AttendanceWidget
            guildCode={guildCode}
            alreadyAttended={data.alreadyAttended}
            streak={data.streak}
            totalAttendances={data.totalAttendances}
            accent={primaryColor}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            surface={primaryColor + "1A"}
          />
        </div>
      </div>
    );
  }

  if (widgetId === "notice") {
    return (
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: primaryColor }} />
            <h2 className="text-sm font-bold" style={{ color: textPrimary }}>공지사항</h2>
          </div>
          <Link href={`/guild/${guildCode}/posts`} className="text-[11px] hover:underline" style={{ color: primaryColor }}>
            전체 보기 →
          </Link>
        </div>
        {data.noticePosts.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: textSecondary }}>등록된 공지가 없어요</p>
        ) : (
          data.noticePosts.map((p) => (
            <Link
              key={p.id}
              href={`/guild/${guildCode}/posts/${p.id}`}
              className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 row-hover"
              style={{ borderColor: dividerColor }}
            >
              {p.is_notice ? (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>공지</span>
              ) : (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: cardBorder, color: textSecondary }}>일반</span>
              )}
              <span className="flex-1 text-sm truncate" style={{ color: textPrimary }}>{p.title}</span>
              <span className="text-[11px] shrink-0" style={{ color: textSecondary }}>{getRelativeTime(p.created_at)}</span>
            </Link>
          ))
        )}
      </div>
    );
  }

  if (widgetId === "guardian") {
    return (
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
          <Swords className="w-4 h-4" style={{ color: primaryColor }} />
          <h2 className="text-sm font-bold" style={{ color: textPrimary }}>이번 주 가디언</h2>
        </div>
        <div className="p-4 flex items-center gap-3">
          {data.guardianImageUrl && (
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1" style={{ borderColor: cardBorder }}>
              <img src={data.guardianImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold" style={{ color: textPrimary }}>{GUARDIAN_NAMES[data.guardianIndex] ?? "—"}</p>
            <p className="text-[10px] mt-0.5" style={{ color: textSecondary }}>매주 수요일 초기화</p>
            <div className="flex gap-1 mt-1.5">
              {data.weaknesses.map((w, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: w.color }}>{w.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetId === "raidStatus") {
    return (
      <RaidStatusGalleryWidget
        raids={data.raids}
        guildCode={guildCode}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        cardBg={cardBg}
        cardBorder={cardBorder}
        dividerColor={dividerColor}
        primaryColor={primaryColor}
      />
    );
  }

  if (widgetId === "stats") {
    const items = [
      { label: "멤버", value: `${guild.member_count}/${guild.max_members}`, accent: false },
      { label: "길드 포인트", value: formatNumber(guild.total_points), accent: true },
      { label: "내 출석", value: `${data.totalAttendances}일`, accent: false },
      { label: "연속 출석", value: `${data.streak}일`, accent: false },
    ];
    return (
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
          <h2 className="text-sm font-bold" style={{ color: textPrimary }}>길드 통계</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {items.map((s) => (
            <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: dividerColor }}>
              <p className="text-[10px] mb-1" style={{ color: textSecondary }}>{s.label}</p>
              <p className="text-base font-bold" style={{ color: s.accent ? primaryColor : textPrimary }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetId === "guildIntro") {
    return (
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
          <h2 className="text-sm font-bold" style={{ color: textPrimary }}>길드 소개</h2>
        </div>
        <div className="p-4">
          <p className="text-sm font-bold" style={{ color: textPrimary }}>{guild.name}</p>
          <p className="text-[11px] font-mono mb-2" style={{ color: primaryColor }}>{guild.code}</p>
          {data.welcomeMessage ? (
            <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{data.welcomeMessage}</p>
          ) : guild.description ? (
            <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{guild.description}</p>
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>아직 소개가 없어요</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
