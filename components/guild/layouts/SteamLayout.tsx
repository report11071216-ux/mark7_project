import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import UpcomingRaidsWidget from "@/components/guild/UpcomingRaidsWidget";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import { Bell, Trophy, Swords, Users, Star } from "lucide-react";

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

export default function SteamLayout({ data, guildCode, widgets }: Props) {
  const { guild, attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, noticePosts,
    guardianIndex, guardianImageUrl, weaknesses,
    primaryColor, backgroundColor } = data;

  const enabled = (id: string) => widgets.some((w) => w.id === id && w.enabled);
  const isLight = isLightColor(backgroundColor);
  const textPrimary = isLight ? "#111827" : "#c6d4df";
  const textSecondary = isLight ? "#6b7280" : "#8f98a0";
  const cardBg = isLight ? "#f3f4f6" : "#16202d";
  const cardBorder = isLight ? "#e5e7eb" : "rgba(255,255,255,0.05)";
  const headerBg = isLight ? "#e5e7eb" : "#1b2838";

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="relative h-52 overflow-hidden border-b" style={{ borderColor: primaryColor + "33" }}>
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 50% 100%, ${primaryColor}33 0%, transparent 70%)`
        }} />
        <div className="relative max-w-5xl mx-auto px-6 h-full flex items-end pb-6">
          <div className="flex items-end gap-5 w-full">
            <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 shrink-0 shadow-lg" style={{ backgroundColor: cardBg, boxShadow: `0 0 24px ${primaryColor}33` }}>
              {guild.logo_url
                ? <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold" style={{ color: primaryColor + "80" }}>{guild.name[0]}</div>
              }
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold" style={{ color: isLight ? "#111827" : "#ffffff" }}>{guild.name}</h1>
                {guild.is_recruiting && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{ backgroundColor: primaryColor + "22", color: primaryColor, borderColor: primaryColor + "50" }}>
                    모집중
                  </span>
                )}
              </div>
              <p className="text-sm truncate" style={{ color: textSecondary }}>{guild.description ?? `${guild.code} 길드`}</p>
            </div>
            <div className="flex items-center gap-6 pb-1 shrink-0">
              {[
                { label: "멤버", value: `${guild.member_count}`, sub: `/ ${guild.max_members}` },
                { label: "포인트", value: formatNumber(guild.total_points) },
                { label: "내 출석", value: `${totalAttendances}일` },
                { label: "연속", value: `${streak}일` },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: textSecondary }}>{s.label}</p>
                  <p className="text-lg font-bold" style={{ color: primaryColor }}>
                    {s.value}
                    {s.sub && <span className="text-sm font-normal" style={{ color: textSecondary }}>{s.sub}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b" style={{ backgroundColor: headerBg, borderColor: cardBorder }}>
        <div className="max-w-5xl mx-auto px-6 flex">
          {["홈", "공지", "멤버", "랭킹", "레이드"].map((tab, i) => (
            <div key={tab} className="px-5 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors"
              style={{
                borderBottomColor: i === 0 ? primaryColor : "transparent",
                color: i === 0 ? primaryColor : textSecondary,
              }}>
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          {enabled("guardian") && (
            <div className="rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBg }}>
              <div className="flex items-stretch">
                {guardianImageUrl ? (
                  <div className="w-40 shrink-0">
                    <img src={guardianImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-40 shrink-0 flex items-center justify-center" style={{ backgroundColor: headerBg }}>
                    <Swords className="w-12 h-12" style={{ color: primaryColor + "50" }} />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>이번 주 가디언</p>
                  <h3 className="text-xl font-bold mb-2" style={{ color: isLight ? "#111827" : "#ffffff" }}>{GUARDIAN_NAMES[guardianIndex] ?? "—"}</h3>
                  <div className="flex gap-1.5 mb-3">
                    {weaknesses.map((w, i) => (
                      <span key={i} className="px-2.5 py-1 rounded text-[11px] font-bold text-white" style={{ backgroundColor: w.color }}>{w.name}</span>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: textSecondary }}>매주 수요일 06:00 KST 초기화</p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {GUARDIAN_NAMES.map((name, i) => (
                      <span key={name} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold" style={{
                        backgroundColor: i === guardianIndex ? primaryColor : i < guardianIndex ? headerBg : cardBg,
                        color: i === guardianIndex ? "#ffffff" : textSecondary,
                        textDecoration: i < guardianIndex ? "line-through" : "none",
                      }}>{name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {enabled("stats") && (
            <div className="rounded-xl p-5 ring-1" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4" style={{ color: primaryColor }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>Guild Stats</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "멤버", value: `${guild.member_count}/${guild.max_members}` },
                  { label: "길드 포인트", value: formatNumber(guild.total_points), accent: true },
                  { label: "내 출석", value: `${totalAttendances}일` },
                  { label: "연속 출석", value: `${streak}일` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-3 text-center ring-1" style={{ backgroundColor: headerBg }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textSecondary }}>{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.accent ? primaryColor : isLight ? "#111827" : "#ffffff" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enabled("notice") && (
            <div className="rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: headerBg, borderColor: cardBorder }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: primaryColor }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>공지사항</p>
                </div>
                <Link href={`/guild/${guildCode}/posts`} className="text-xs hover:opacity-70 transition-opacity" style={{ color: primaryColor }}>
                  전체 보기 →
                </Link>
              </div>
              {noticePosts.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: textSecondary }}>공지가 없어요</p>
              ) : noticePosts.map((p) => (
                <Link key={p.id} href={`/guild/${guildCode}/posts/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3 border-b last:border-0 row-hover"
                  style={{ borderColor: cardBorder }}
                >
                  {p.is_notice && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>공지</span>
                  )}
                  <span className="flex-1 text-sm truncate" style={{ color: textPrimary }}>{p.title}</span>
                  <span className="text-[11px] shrink-0" style={{ color: textSecondary }}>{getRelativeTime(p.created_at)}</span>
                </Link>
              ))}
            </div>
          )}

          {enabled("raidSchedule") && (
            <UpcomingRaidsWidget
              guildId={guild.id}
              guildCode={guildCode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              accent={primaryColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
              surface={headerBg}
            />
          )}

          {enabled("calendar") && <MiniCalendar attendanceDates={attendanceDates} />}
        </div>

        <div className="w-[220px] shrink-0 space-y-4">
          {enabled("attendance") && (
            <div className="rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBg }}>
              <div className="px-4 py-3 border-b" style={{ backgroundColor: headerBg, borderColor: cardBorder }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>일일 출석</p>
              </div>
              <div className="p-3">
                <AttendanceWidget guildCode={guildCode} alreadyAttended={alreadyAttended} streak={streak} totalAttendances={totalAttendances} />
              </div>
            </div>
          )}

          {enabled("pointRanking") && (
            <div className="rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: headerBg, borderColor: cardBorder }}>
                <Trophy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>랭킹</p>
              </div>
              <div className="py-1">
                {rankingMembers.slice(0, 8).map((m, i) => (
                  <div key={m.user_id} className="flex items-center gap-2.5 px-4 py-2 row-hover">
                    <span className="text-[10px] font-bold w-4 text-center shrink-0" style={{
                      color: i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : i === 2 ? "#f97316" : textSecondary
                    }}>{i + 1}</span>
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "33" }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[9px] font-bold" style={{ color: primaryColor }}>{m.profiles?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="text-xs truncate flex-1" style={{ color: textPrimary }}>{m.profiles?.username ?? "?"}</span>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: primaryColor }}>{m.points}P</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enabled("recentMembers") && (
            <div className="rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: headerBg, borderColor: cardBorder }}>
                <Users className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>최근 가입</p>
              </div>
              <div className="py-1">
                {recentMembers.slice(0, 5).map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2.5 px-4 py-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "33" }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[9px] font-bold" style={{ color: primaryColor }}>{m.profiles?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="text-xs flex-1 truncate" style={{ color: textPrimary }}>{m.profiles?.username ?? "?"}</span>
                    <span className="text-[10px] shrink-0" style={{ color: textSecondary }}>{getRelativeTime(m.joined_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
