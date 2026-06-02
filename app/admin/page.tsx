import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Shield, FileText, UserPlus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    guildCountResult,
    memberCountResult,
    userCountResult,
    postCountResult,
    recruitingCountResult,
    newUserCountResult,
    recentGuildsResult,
    recentUsersResult,
  ] = await Promise.all([
    supabase.from("guilds").select("*", { count: "exact", head: true }),
    supabase.from("guild_members").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("guilds")
      .select("*", { count: "exact", head: true })
      .eq("is_recruiting", true),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("guilds")
      .select("id, code, name, server, member_count, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    {
      label: "전체 길드",
      value: guildCountResult.count ?? 0,
      icon: Shield,
      hint: `모집중 ${recruitingCountResult.count ?? 0}개`,
    },
    {
      label: "전체 회원",
      value: userCountResult.count ?? 0,
      icon: Users,
      hint: `최근 7일 +${newUserCountResult.count ?? 0}`,
    },
    {
      label: "길드 가입 건수",
      value: memberCountResult.count ?? 0,
      icon: UserPlus,
      hint: "guild_members 행 수",
    },
    {
      label: "전체 게시글",
      value: postCountResult.count ?? 0,
      icon: FileText,
      hint: "광장 + 길드 게시판",
    },
  ];

  const recentGuilds = recentGuildsResult.data ?? [];
  const recentUsers = recentUsersResult.data ?? [];

  return (
    <div className="space-y-6">
      {/* 지표 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl bg-white ring-1 ring-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {s.value.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{s.hint}</p>
            </div>
          );
        })}
      </div>

      {/* 활동 피드 2단 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 최근 생성된 길드 */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900">최근 생성된 길드</h2>
          </div>
          {recentGuilds.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">아직 생성된 길드가 없어요</p>
          ) : (
            <div className="space-y-1">
              {recentGuilds.map((g) => (
                <Link
                  key={g.id}
                  href={`/guild/${g.code}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {(g.name ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{g.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {g.server ? `${g.server} · ` : ""}{g.member_count ?? 0}명
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(g.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 최근 가입한 회원 */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">최근 가입한 회원</h2>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">아직 가입한 회원이 없어요</p>
          ) : (
            <div className="space-y-1">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                      {(u.username ?? "?").charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.username ?? "이름 없음"}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
