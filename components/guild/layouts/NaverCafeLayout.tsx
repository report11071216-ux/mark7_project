import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import OnlineMembersCard from "@/components/guild/OnlineMembersCard";
import RankingCard from "@/components/guild/RankingCard";
import RecentMembersCard from "@/components/guild/RecentMembersCard";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import { Bell, Swords } from "lucide-react";

type Props = {
  data: GuildLayoutData;
  guildCode: string;
  widgets: ThemeWidget[];
};

const GUARDIAN_NAMES = ["루멘칼리고","가르가디스","스콜라키아","크라티오스","아게오로스","드렉탈라스","소나벨","베스칼"];

function isLightColor(hex: string) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function NaverCafeLayout({ data, guildCode, widgets }: Props) {
  const { guild, attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, onlineMembers, noticePosts,
    guardianIndex, guardianImageUrl, weaknesses,
    primaryColor, backgroundColor } = data;

  const enabled = (id: string) => widgets.some((w) => w.id === id && w.enabled);
  const isLight = isLightColor(backgroundColor);
  const textPrimary = isLight ? "#111827" : "#ffffff";
  const textSecondary = isLight ? "#6b7280" : "#a1a1aa";
  const cardBg = isLight ? "#ffffff" : "#18181b";
  const cardBorder = isLight ? "#e5e7eb" : "#27272a";
  const dividerColor = isLight ? "#f3f4f6" : "#27272a";

  const tabs = [
    { label: "홈", href: `/guild/${guildCode}` },
    { label: "공지", href: `/guild/${guildCode}/posts` },
    { label: "멤버", href: null },
    { label: "랭킹", href: null },
    { label: "레이드", href: null },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="border-b shadow-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="max-w-[1080px] mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
              {guild.logo_url
                ? <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{guild.name?.[0] ?? "G"}</span>
              }
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: textPrimary }}>{guild.name}</h1>
              <p className="text-[11px] font-mono" style={{ color: primaryColor }}>{guild.code}</p>
            </div>
            <div className="flex items-center gap-6 ml-auto">
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
                  style={{
                    borderBottomColor: "transparent",
                    color: textSecondary,
                    opacity: 0.4,
                  }}
                >
                  {tab.label}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-4 py-4 flex gap-4">
        <div className="w-[168px] shrink-0 space-y-3">
          {enabled("pointRanking") && (
            <RankingCard
              rankingMembers={rankingMembers}
              textPrimary={textPrimary}
              primaryColor={primaryColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
            />
          )}

          {enabled("onlineMembers") && (
            <OnlineMembersCard
              onlineMembers={onlineMembers}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              cardBg={cardBg}
              cardBorder={cardBorder}
              primaryColor={primaryColor}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {enabled("notice") && (
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
              <div className="grid grid-cols-[auto_1fr_80px_70px] gap-2 px-4 py-2 border-b text-[10px] font-medium uppercase" style={{ borderColor: dividerColor, color: textSecondary }}>
                <span className="w-8">구분</span>
                <span>제목</span>
                <span>작성자</span>
                <span className="text-right">날짜</span>
              </div>
              {noticePosts.length === 0
                ? <p className="text-sm text-center py-8" style={{ color: textSecondary }}>등록된 공지가 없어요</p>
                : noticePosts.map((p) => (
                  <Link key={p.id} href={`/guild/${guildCode}/posts/${p.id}`}
                    className="grid grid-cols-[auto_1fr_80px_70px] gap-2 items-center px-4 py-2.5 border-b last:border-0 row-hover"
                    style={{ borderColor: dividerColor }}
                  >
                    <span className="w-8">
                      {p.is_notice
                        ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>공지</span>
                        : <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: cardBorder, color: textSecondary }}>일반</span>
                      }
                    </span>
                    <span className="text-sm truncate" style={{ color: textPrimary }}>{p.title}</span>
                    <span className="text-[11px] truncate" style={{ color: textSecondary }}>{p.author?.username ?? "Unknown"}</span>
                    <span className="text-[11px] text-right" style={{ color: textSecondary }}>{getRelativeTime(p.created_at)}</span>
                  </Link>
                ))
              }
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {enabled("guardian") && (
              <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
                  <Swords className="w-4 h-4" style={{ color: primaryColor }} />
                  <h2 className="text-sm font-bold" style={{ color: textPrimary }}>이번 주 가디언</h2>
                </div>
                <div className="p-4 flex items-center gap-3">
                  {guardianImageUrl && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1" style={{ borderColor: cardBorder }}>
                      <img src={guardianImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold" style={{ color: textPrimary }}>{GUARDIAN_NAMES[guardianIndex] ?? "—"}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: textSecondary }}>매주 수요일 초기화</p>
                    <div className="flex gap-1 mt-1.5">
                      {weaknesses.map((w, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: w.color }}>{w.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {enabled("recentMembers") && (
              <RecentMembersCard
                recentMembers={recentMembers}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                primaryColor={primaryColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                dividerColor={dividerColor}
              />
            )}
          </div>

          {enabled("calendar") && <MiniCalendar attendanceDates={attendanceDates} />}
        </div>

        <div className="w-[176px] shrink-0 space-y-3">
          {enabled("attendance") && (
            <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="px-4 py-2.5" style={{ backgroundColor: primaryColor }}>
                <p className="text-xs font-bold text-white">오늘의 출석</p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: primaryColor + "11" }}>
                    <p className="text-[9px]" style={{ color: textSecondary }}>총 출석</p>
                    <p className="text-base font-bold" style={{ color: textPrimary }}>{totalAttendances}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: primaryColor + "22" }}>
                    <p className="text-[9px]" style={{ color: primaryColor }}>연속</p>
                    <p className="text-base font-bold" style={{ color: primaryColor }}>{streak}일</p>
                  </div>
                </div>
                <AttendanceWidget
                  guildCode={guildCode}
                  alreadyAttended={alreadyAttended}
                  streak={streak}
                  totalAttendances={totalAttendances}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
