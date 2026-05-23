import Link from "next/link";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import { Bell, Users, Trophy, Swords, Eye } from "lucide-react";

type Props = {
  data: GuildLayoutData;
  guildCode: string;
  widgets: ThemeWidget[];
};

function isOnline(t: string | null) {
  if (!t) return false;
  return Date.now() - new Date(t).getTime() < 5 * 60 * 1000;
}

export default function NaverCafeLayout({ data, guildCode, widgets }: Props) {
  const { guild, attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, onlineMembers, noticePosts,
    guardianIndex, guardianImageUrl, weaknesses } = data;

  const enabled = (id: string) => widgets.some((w) => w.id === id && w.enabled);
  const online = onlineMembers.filter((m) => isOnline(m.last_seen_at));

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1080px] mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
              {guild.logo_url
                ? <img src={guild.logo_url} alt={guild.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{guild.name[0]}</span>
              }
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{guild.name}</h1>
              <p className="text-[11px] font-mono text-blue-600">{guild.code}</p>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase">멤버</p>
                <p className="text-sm font-bold text-gray-800">{guild.member_count}/{guild.max_members}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase">포인트</p>
                <p className="text-sm font-bold text-blue-600">{formatNumber(guild.total_points)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase">내 출석</p>
                <p className="text-sm font-bold text-green-600">{totalAttendances}일</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase">연속</p>
                <p className="text-sm font-bold text-orange-500">{streak}일</p>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex border-t border-gray-100">
            {["홈", "공지", "멤버", "랭킹", "레이드"].map((menu, i) => (
              <div key={menu} className={
                "px-5 py-2.5 text-sm font-medium border-b-2 cursor-pointer transition-colors " +
                (i === 0 ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300")
              }>
                {menu}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="max-w-[1080px] mx-auto px-4 py-4 flex gap-4">

        {/* 왼쪽 사이드바 */}
        <div className="w-[168px] shrink-0 space-y-3">
          {/* 포인트 랭킹 */}
          {enabled("pointRanking") && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-600">
                <Trophy className="w-3.5 h-3.5 text-white" />
                <p className="text-[11px] font-bold text-white">포인트 랭킹</p>
              </div>
              <div className="py-1">
                {rankingMembers.slice(0, 7).map((m, i) => (
                  <div key={m.user_id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                    <span className={
                      "text-[10px] font-bold w-4 text-center " +
                      (i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300")
                    }>{i + 1}</span>
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-blue-100 shrink-0 flex items-center justify-center">
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[8px] font-bold text-blue-700">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="text-[11px] text-gray-700 truncate flex-1">{m.profiles?.username ?? "?"}</span>
                    <span className="text-[10px] font-bold text-blue-600 shrink-0">{m.points}P</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 온라인 */}
          {enabled("onlineMembers") && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-[11px] font-bold text-gray-700">접속중 {online.length}명</p>
              </div>
              <div className="py-1">
                {online.length === 0
                  ? <p className="text-[11px] text-gray-400 text-center py-3">없음</p>
                  : online.slice(0, 6).map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[11px] text-gray-700 truncate">{m.profiles?.username ?? "?"}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* 메인 */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 공지 게시판 */}
          {enabled("notice") && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-gray-900">공지사항</h2>
                </div>
                <Link href={`/guild/${guildCode}/posts`} className="text-[11px] text-blue-600 hover:underline">
                  전체 보기 →
                </Link>
              </div>
              {/* 게시판 헤더 */}
              <div className="grid grid-cols-[auto_1fr_80px_70px] gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium text-gray-400 uppercase">
                <span className="w-8">구분</span>
                <span>제목</span>
                <span>작성자</span>
                <span className="text-right">날짜</span>
              </div>
              {noticePosts.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">등록된 공지가 없어요</p>
                : noticePosts.map((p) => (
                  <Link key={p.id} href={`/guild/${guildCode}/posts/${p.id}`}
                    className="grid grid-cols-[auto_1fr_80px_70px] gap-2 items-center px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors"
                  >
                    <span className="w-8">
                      {p.is_notice
                        ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">공지</span>
                        : <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-500">일반</span>
                      }
                    </span>
                    <span className="text-sm text-gray-800 truncate">{p.title}</span>
                    <span className="text-[11px] text-gray-500 truncate">{p.author?.username ?? "Unknown"}</span>
                    <span className="text-[11px] text-gray-400 text-right">{getRelativeTime(p.created_at)}</span>
                  </Link>
                ))
              }
            </div>
          )}

          {/* 가디언 + 최근 가입 */}
          <div className="grid grid-cols-2 gap-3">
            {enabled("guardian") && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <Swords className="w-4 h-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-900">이번 주 가디언</h2>
                </div>
                <div className="p-4 flex items-center gap-3">
                  {guardianImageUrl && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-200">
                      <img src={guardianImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{["루멘칼리고","가르가디스","스콜라키아","크라티오스","아게오로스","드렉탈라스","소나벨","베스칼"][guardianIndex] ?? "—"}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">매주 수요일 초기화</p>
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
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <Users className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-bold text-gray-900">최근 가입</h2>
                </div>
                <div>
                  {recentMembers.slice(0, 4).map((m) => (
                    <div key={m.user_id} className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                        {m.profiles?.avatar_url
                          ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-bold text-blue-700">{m.profiles?.username?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <span className="text-sm text-gray-800 flex-1 truncate">{m.profiles?.username ?? "?"}</span>
                      <span className="text-[11px] text-gray-400">{getRelativeTime(m.joined_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 캘린더 */}
          {enabled("calendar") && (
            <MiniCalendar attendanceDates={attendanceDates} />
          )}
        </div>

        {/* 우측 */}
        <div className="w-[176px] shrink-0 space-y-3">
          {/* 출석 */}
          {enabled("attendance") && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-blue-600">
                <p className="text-xs font-bold text-white">오늘의 출석</p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-[9px] text-gray-400">총 출석</p>
                    <p className="text-base font-bold text-gray-900">{totalAttendances}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-[9px] text-green-600">연속</p>
                    <p className="text-base font-bold text-green-600">{streak}일</p>
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

          {/* 길드 소개 */}
          {enabled("guildIntro") && guild.description && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-[11px] font-bold text-gray-700">길드 소개</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-6">{guild.description}</p>
                {guild.is_recruiting && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                    멤버 모집중
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
