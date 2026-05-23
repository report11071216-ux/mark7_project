import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import { Hash, Bell, Trophy, Swords, Users, Wifi, Shield, CalendarDays } from "lucide-react";

type Props = {
  data: GuildLayoutData;
  guildCode: string;
  widgets: ThemeWidget[];
};

const GUARDIAN_NAMES = ["루멘칼리고","가르가디스","스콜라키아","크라티오스","아게오로스","드렉탈라스","소나벨","베스칼"];

function isOnline(t: string | null) {
  if (!t) return false;
  return Date.now() - new Date(t).getTime() < 5 * 60 * 1000;
}

function isRecent(t: string | null) {
  if (!t) return false;
  const diff = Date.now() - new Date(t).getTime();
  return diff < 30 * 60 * 1000;
}

export default function DiscordLayout({ data, guildCode, widgets }: Props) {
  const { guild, attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, onlineMembers, noticePosts,
    guardianIndex, guardianImageUrl, weaknesses } = data;

  const enabled = (id: string) => widgets.some((w) => w.id === id && w.enabled);
  const online = onlineMembers.filter((m) => isOnline(m.last_seen_at));
  const recent = onlineMembers.filter((m) => !isOnline(m.last_seen_at) && isRecent(m.last_seen_at));

  const channels = [
    { icon: Hash, label: "길드-홈", active: true },
    { icon: Bell, label: "공지사항", active: false },
    { icon: Trophy, label: "랭킹", active: false },
    { icon: Swords, label: "레이드", active: false },
    { icon: CalendarDays, label: "일정", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] flex flex-col">
      {/* 서버 헤더 */}
      <div className="h-12 bg-[#1e1f22] border-b border-black/30 flex items-center px-4 gap-3 shrink-0 shadow-md">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          {guild.logo_url
            ? <img src={guild.logo_url} alt="" className="w-full h-full object-cover" />
            : <Shield className="w-3.5 h-3.5 text-white" />
          }
        </div>
        <h1 className="text-sm font-bold text-white truncate">{guild.name}</h1>
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-[11px] text-[#949ba4]">{guild.member_count}명</span>
          <span className="text-[11px] font-bold text-violet-300">{formatNumber(guild.total_points)}P</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 채널 사이드바 */}
        <div className="w-[220px] shrink-0 bg-[#2b2d31] flex flex-col">
          <div className="px-2 pt-4 pb-2">
            <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1">
              텍스트 채널
            </p>
            {channels.map((ch) => (
              <div key={ch.label} className={
                "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors " +
                (ch.active ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]")
              }>
                <ch.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{ch.label}</span>
              </div>
            ))}
          </div>

          <div className="px-2 mt-4">
            <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1">
              멤버 현황
            </p>
            <div className="px-2 py-1.5 flex items-center gap-2 text-[#949ba4]">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-[11px]">온라인 — {online.length}명</span>
            </div>
            <div className="px-2 py-1.5 flex items-center gap-2 text-[#949ba4]">
              <span className="w-2 h-2 rounded-full bg-[#949ba4] shrink-0" />
              <span className="text-[11px]">오프라인 — {onlineMembers.length - online.length}명</span>
            </div>
          </div>

          {/* 포인트 랭킹 */}
          {enabled("pointRanking") && (
            <div className="px-2 mt-4">
              <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1">
                포인트 TOP 5
              </p>
              {rankingMembers.slice(0, 5).map((m, i) => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors">
                  <span className={
                    "text-[10px] font-bold w-4 shrink-0 " +
                    (i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-[#949ba4]")
                  }>{i + 1}</span>
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-violet-900 flex items-center justify-center shrink-0">
                    {m.profiles?.avatar_url
                      ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[9px] font-bold text-violet-300">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <span className="text-[11px] text-[#dbdee1] truncate flex-1">{m.profiles?.username ?? "?"}</span>
                  <span className="text-[10px] font-bold text-violet-300 shrink-0">{m.points}P</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메인 컨텐츠 피드 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 채널 헤더 */}
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Hash className="w-5 h-5 text-[#949ba4]" />
            <h2 className="text-white font-bold">길드-홈</h2>
            <span className="text-[#949ba4] text-sm">· {guild.name} 길드 홈 채널</span>
          </div>

          {/* 출석 카드 */}
          {enabled("attendance") && (
            <div className="bg-[#2b2d31] rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Daily Attendance</p>
              </div>
              <div className="flex gap-4 mb-3">
                <div className="bg-[#1e1f22] rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-[#949ba4]">총 출석</p>
                  <p className="text-xl font-bold text-white">{totalAttendances}일</p>
                </div>
                <div className="bg-[#1e1f22] rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-[#949ba4]">연속</p>
                  <p className="text-xl font-bold text-violet-300">{streak}일</p>
                </div>
              </div>
              <AttendanceWidget
                guildCode={guildCode}
                alreadyAttended={alreadyAttended}
                streak={streak}
                totalAttendances={totalAttendances}
              />
            </div>
          )}

          {/* 통계 */}
          {enabled("stats") && (
            <div className="bg-[#2b2d31] rounded-lg p-4 border border-white/5">
              <p className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-3">Guild Stats</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "멤버", value: `${guild.member_count}/${guild.max_members}` },
                  { label: "길드 포인트", value: formatNumber(guild.total_points), accent: true },
                  { label: "접속중", value: `${online.length}명` },
                ].map((s) => (
                  <div key={s.label} className="bg-[#1e1f22] rounded-lg p-3 text-center">
                    <p className="text-[10px] text-[#949ba4] mb-1">{s.label}</p>
                    <p className={`text-lg font-bold ${s.accent ? "text-violet-300" : "text-white"}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 공지 */}
          {enabled("notice") && (
            <div className="bg-[#2b2d31] rounded-lg overflow-hidden border border-white/5">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#949ba4]" />
                  <p className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">공지사항</p>
                </div>
                <Link href={`/guild/${guildCode}/posts`} className="text-[11px] text-violet-400 hover:text-violet-300">
                  전체 보기 →
                </Link>
              </div>
              {noticePosts.length === 0
                ? <p className="text-sm text-[#949ba4] text-center py-6">공지가 없어요</p>
                : noticePosts.map((p) => (
                  <Link key={p.id} href={`/guild/${guildCode}/posts/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-[#35373c] transition-colors"
                  >
                    {p.is_notice && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">공지</span>
                    )}
                    <span className="flex-1 text-sm text-[#dbdee1] truncate">{p.title}</span>
                    <span className="text-[11px] text-[#949ba4] shrink-0">{getRelativeTime(p.created_at)}</span>
                  </Link>
                ))
              }
            </div>
          )}

          {/* 가디언 */}
          {enabled("guardian") && (
            <div className="bg-[#2b2d31] rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="w-4 h-4 text-[#949ba4]" />
                <p className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">이번 주 가디언</p>
              </div>
              <div className="flex items-center gap-4">
                {guardianImageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10">
                    <img src={guardianImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <p className="text-base font-bold text-white">{GUARDIAN_NAMES[guardianIndex] ?? "—"}</p>
                  <p className="text-[11px] text-[#949ba4] mt-0.5">매주 수요일 06:00 초기화</p>
                  <div className="flex gap-1 mt-2">
                    {weaknesses.map((w, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: w.color }}>{w.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 캘린더 */}
          {enabled("calendar") && (
            <MiniCalendar attendanceDates={attendanceDates} />
          )}
        </div>

        {/* 오른쪽 멤버 패널 */}
        <div className="w-[200px] shrink-0 bg-[#2b2d31] overflow-y-auto p-3">
          {online.length > 0 && (
            <div className="mb-4">
              <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">
                온라인 — {online.length}
              </p>
              {online.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-900 flex items-center justify-center">
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-violet-300">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#2b2d31]" />
                  </div>
                  <span className="text-sm text-[#dbdee1] truncate">{m.profiles?.username ?? "?"}</span>
                </div>
              ))}
            </div>
          )}

          {recent.length > 0 && (
            <div className="mb-4">
              <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">
                최근 접속
              </p>
              {recent.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md opacity-60">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#383a40] flex items-center justify-center">
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-[#949ba4]">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#949ba4] ring-2 ring-[#2b2d31]" />
                  </div>
                  <span className="text-sm text-[#949ba4] truncate">{m.profiles?.username ?? "?"}</span>
                </div>
              ))}
            </div>
          )}

          {enabled("recentMembers") && (
            <div>
              <p className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">
                최근 가입
              </p>
              {recentMembers.slice(0, 5).map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#383a40] flex items-center justify-center shrink-0">
                    {m.profiles?.avatar_url
                      ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-[#949ba4]">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#dbdee1] truncate">{m.profiles?.username ?? "?"}</p>
                    <p className="text-[10px] text-[#949ba4]">{m.points}P</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
