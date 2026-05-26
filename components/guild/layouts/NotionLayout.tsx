import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import UpcomingRaidsWidget from "@/components/guild/UpcomingRaidsWidget";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import { Users, ChevronRight } from "lucide-react";

type Props = {
  data: GuildLayoutData;
  guildCode: string;
  widgets: ThemeWidget[];
};

const GUARDIAN_NAMES = ["루멘칼리고","가르가디스","스콜라키아","크라티오스","아게오로스","드렉탈라스","소나벨","베스칼"];

function isLightColor(hex: string) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function NotionLayout({ data, guildCode, widgets }: Props) {
  const { guild, attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, noticePosts,
    guardianIndex, guardianImageUrl, weaknesses,
    primaryColor, backgroundColor } = data;

  const enabled = (id: string) => widgets.some((w) => w.id === id && w.enabled);
  const isLight = isLightColor(backgroundColor);
  const textPrimary = isLight ? "#111827" : "#ffffff";
  const textSecondary = isLight ? "#6b7280" : "#a1a1aa";
  const cardBg = isLight ? "#ffffff" : "#18181b";
  const cardBorder = isLight ? "#e5e7eb" : "#27272a";

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="h-28 relative overflow-hidden" style={{
        background: `linear-gradient(to bottom, ${primaryColor}22, ${backgroundColor})`
      }}>
        <div className="max-w-4xl mx-auto px-8 h-full flex items-end pb-0">
          <div className="flex items-center gap-4 translate-y-6">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md ring-4 shrink-0" style={{ backgroundColor: cardBg }}>
              {guild.logo_url
                ? <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>{guild.name[0]}</div>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pt-10 pb-6 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: textPrimary }}>{guild.name}</h1>
            {guild.description && (
              <p className="text-sm leading-relaxed max-w-xl" style={{ color: textSecondary }}>{guild.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: textSecondary }}>
                <Users className="w-3.5 h-3.5" />{guild.member_count}/{guild.max_members}명
              </span>
              <span style={{ color: cardBorder }}>|</span>
              <span className="text-xs font-mono" style={{ color: textSecondary }}>{guild.code}</span>
              {guild.is_recruiting && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>
                  멤버 모집중
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: textSecondary }}>길드 포인트</p>
            <p className="text-2xl font-bold" style={{ color: textPrimary }}>{formatNumber(guild.total_points)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-8">
        {enabled("stats") && (
          <div className="grid grid-cols-4 gap-px rounded-xl overflow-hidden ring-1" style={{ backgroundColor: cardBorder }}>
            {[
              { label: "멤버", value: `${guild.member_count}/${guild.max_members}` },
              { label: "길드 포인트", value: formatNumber(guild.total_points), accent: true },
              { label: "내 출석", value: `${totalAttendances}일` },
              { label: "연속 출석", value: `${streak}일` },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ backgroundColor: cardBg }}>
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textSecondary }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.accent ? primaryColor : textPrimary }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {enabled("attendance") && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                오늘의 출석
              </h2>
              <AttendanceWidget guildCode={guildCode} alreadyAttended={alreadyAttended} streak={streak} totalAttendances={totalAttendances} />
            </div>
          )}

          {enabled("guardian") && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                이번 주 가디언
              </h2>
              <div className="rounded-xl border p-4" style={{ backgroundColor: isLight ? "#f9fafb" : "#27272a", borderColor: cardBorder }}>
                <div className="flex items-center gap-3">
                  {guardianImageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 ring-1" style={{ borderColor: cardBorder }}>
                      <img src={guardianImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold" style={{ color: textPrimary }}>{GUARDIAN_NAMES[guardianIndex] ?? "—"}</p>
                    <p className="text-xs mt-0.5" style={{ color: textSecondary }}>매주 수요일 초기화</p>
                    <div className="flex gap-1 mt-1.5">
                      {weaknesses.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: w.color }}>{w.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {enabled("calendar") && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
              출석 캘린더
            </h2>
            <MiniCalendar attendanceDates={attendanceDates} />
          </div>
        )}

        {enabled("notice") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                공지사항
              </h2>
              <Link href={`/guild/${guildCode}/posts`} className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: textSecondary }}>
                전체 보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-xl overflow-hidden ring-1" style={{ borderColor: cardBorder }}>
              <div className="grid grid-cols-[1fr_100px_80px] px-4 py-2 border-b" style={{ backgroundColor: isLight ? "#f9fafb" : "#27272a", borderColor: cardBorder }}>
                <span className="text-[10px] font-semibold uppercase" style={{ color: textSecondary }}>제목</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: textSecondary }}>작성자</span>
                <span className="text-[10px] font-semibold uppercase text-right" style={{ color: textSecondary }}>날짜</span>
              </div>
              {noticePosts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ backgroundColor: cardBg, color: textSecondary }}>공지가 없어요</div>
              ) : noticePosts.map((p) => (
                <Link key={p.id} href={`/guild/${guildCode}/posts/${p.id}`}
                  className="grid grid-cols-[1fr_100px_80px] px-4 py-3 border-b last:border-0 row-hover"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.is_notice && <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
                    <span className="text-sm truncate" style={{ color: textPrimary }}>{p.title}</span>
                  </div>
                  <span className="text-xs self-center" style={{ color: textSecondary }}>{p.author?.username ?? "—"}</span>
                  <span className="text-xs self-center text-right" style={{ color: textSecondary }}>{getRelativeTime(p.created_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {enabled("raidSchedule") && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
              레이드 일정
            </h2>
            <UpcomingRaidsWidget
              guildId={guild.id}
              guildCode={guildCode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              accent={primaryColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
              surface={isLight ? "#f9fafb" : "#27272a"}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {enabled("pointRanking") && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                포인트 랭킹
              </h2>
              <div className="space-y-1">
                {rankingMembers.slice(0, 7).map((m, i) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-lg row-hover">
                    <span className="text-xs font-bold w-4 text-center shrink-0" style={{
                      color: i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : i === 2 ? "#f97316" : textSecondary
                    }}>{i + 1}</span>
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: primaryColor + "22" }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold" style={{ color: primaryColor }}>{m.profiles?.username?.[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: textPrimary }}>{m.profiles?.username ?? "?"}</span>
                    <span className="text-sm font-bold font-mono shrink-0" style={{ color: textPrimary }}>{m.points}P</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enabled("recentMembers") && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
                <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                최근 가입
              </h2>
              <div className="space-y-1">
                {recentMembers.slice(0, 7).map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-lg row-hover">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: primaryColor + "22" }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold" style={{ color: primaryColor }}>{m.profiles?.username?.[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: textPrimary }}>{m.profiles?.username ?? "?"}</span>
                    <span className="text-xs" style={{ color: textSecondary }}>{getRelativeTime(m.joined_at)}</span>
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
